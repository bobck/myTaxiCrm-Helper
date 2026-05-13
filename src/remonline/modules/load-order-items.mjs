// Подгружает позиции (items) заказов из roapp.io v2 API в Postgres.
// Дискавери — заказы из PG с `modifiedAt > watermark` из `entity_sync('OrderItem')`.
// Ожидается, что джоба сначала прогоняет `loadOrders` (он двигает watermark
// `entity_sync('Order')` и подкладывает новые/обновлённые заказы в PG),
// а потом этот модуль на основании их `modifiedAt` решает, у кого тянуть items.
import { getOrderItemsBatch } from '../remonline.utils.mjs';
import prisma from '../remonline.prisma.mjs';
import { devLog } from '../../shared/shared.utils.mjs';
import { remonlineTokenToEnv } from '../remonline.api.mjs';
import {
  getEntitySync,
  upsertEntitySync,
} from '../remonline.queries.mjs';

const ENTITY_NAME = 'OrderItem';

function isoOrNull(value) {
  if (!value) return null;
  if (!Number.isFinite(Date.parse(value))) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00Z`);
  return new Date(value);
}

function toFloat(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function jsonOrNull(value) {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value) && value.length === 0) return null;
  if (
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length === 0
  ) {
    return null;
  }
  return JSON.stringify(value);
}

function mapItemToPgRow({ orderId, item }) {
  const entity = item.entity || {};
  const uom = entity.uom || {};
  const discount = item.discount || {};
  const warranty = item.warranty || {};

  return {
    orderId,
    id: item.id,
    createdAt: isoOrNull(item.created_at),
    assigneeId: item.assignee_id ?? null,
    entityId: entity.id ?? null,
    entityType: entity.type ?? null,
    entityTitle: entity.title ?? null,
    entityCode: entity.code ?? null,
    entitySku: entity.sku ?? null,
    entityDescription: entity.description ?? null,
    entitySnAccounting: entity.sn_accounting ?? null,
    entityIsHidden: entity.is_hidden ?? null,
    uomId: uom.id ?? null,
    uomTitle: uom.title ?? null,
    uomDescription: uom.description ?? null,
    quantity: toFloat(item.quantity),
    price: toFloat(item.price),
    cost: toFloat(item.cost),
    marginId: item.margin_id ?? null,
    isDeductionRequired: item.is_deduction_required ?? null,
    isRefunded: item.is_refunded ?? null,
    comment: item.comment ?? null,
    commentVisibility: item.comment_visibility ?? null,
    discountType: discount.type ?? null,
    discountPercentage: toFloat(discount.percentage),
    discountAmount: toFloat(discount.amount),
    discountSponsor: discount.sponsor ?? null,
    warrantyPeriod: warranty.period ?? null,
    warrantyPeriodUnits: warranty.period_units ?? warranty.unit ?? null,
    expirationDate: isoOrNull(item.expiration_date),
    taxes: jsonOrNull(item.taxes),
    writeOffs: jsonOrNull(item.write_offs),
  };
}

export async function loadOrderItems() {
  const time = new Date();
  devLog({ time, message: 'loadOrderItems' });

  const sync = await getEntitySync(ENTITY_NAME);
  const lastModifiedAt = sync.last_modified_at || null;

  const orders = await prisma.order.findMany({
    where: lastModifiedAt
      ? { modifiedAt: { gt: new Date(lastModifiedAt) } }
      : {},
    select: { id: true, modifiedAt: true },
    orderBy: { modifiedAt: 'asc' },
  });

  if (orders.length === 0) {
    devLog({
      message: 'loadOrderItems: no orders past watermark, skipping',
      lastModifiedAt,
    });
    return;
  }

  const orderIds = orders.map((o) => o.id);

  devLog({
    message: 'loadOrderItems',
    lastModifiedAt,
    ordersToProcess: orderIds.length,
  });

  const { items, failedOrderIds } = await getOrderItemsBatch(orderIds);
  devLog({
    message: 'loadOrderItems fetched',
    fetchedItems: items.length,
    failedOrderIds: failedOrderIds.length,
  });

  const failedSet = new Set(failedOrderIds);
  const successIds = orders
    .map((o) => o.id)
    .filter((id) => !failedSet.has(id));

  if (successIds.length === 0) {
    devLog({
      message: 'loadOrderItems: nothing succeeded, watermark unchanged',
    });
    return;
  }

  const rows = items
    .filter((item) => !failedSet.has(item.order_id))
    .map((item) => mapItemToPgRow({ orderId: item.order_id, item }));

  await prisma.$transaction([
    prisma.orderItem.deleteMany({ where: { orderId: { in: successIds } } }),
    prisma.orderItem.createMany({ data: rows }),
  ]);

  // `orders` is sorted ASC by modifiedAt. Advance watermark up to (but not
  // past) the first failure so failed orders keep getting retried; skipping
  // that invariant would silently drop any failed order whose modifiedAt
  // lies below a later success.
  let newWatermark = null;
  for (const o of orders) {
    if (failedSet.has(o.id)) break;
    if (o.modifiedAt) newWatermark = o.modifiedAt;
  }
  if (newWatermark) {
    const iso = newWatermark.toISOString().replace(/\.\d{3}Z$/, 'Z');
    await upsertEntitySync(ENTITY_NAME, { last_modified_at: iso });
  }

  devLog({ message: `Loaded ${rows.length} order items` });
}

if (process.env.ENV === 'TEST') {
  devLog({ message: 'Running loadOrderItems in TEST mode...' });
  await remonlineTokenToEnv(true);
  await loadOrderItems();
}
