import { getOrderItemsBatch } from '../remonline.utils.mjs';
import prisma from '../remonline.prisma.mjs';
import { devLog } from '../../shared/shared.utils.mjs';
import { remonlineTokenToEnv } from '../remonline.api.mjs';

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

  const allOrderIds = (await prisma.order.findMany({ select: { id: true } }))
    .map((r) => r.id);
  if (allOrderIds.length === 0) {
    devLog({ message: 'loadOrderItems: no orders, skipping' });
    return;
  }

  const presentRaw = await prisma.orderItem.findMany({
    distinct: ['orderId'],
    select: { orderId: true },
  });
  const present = new Set(presentRaw.map((r) => r.orderId));
  const missingOrderIds = allOrderIds.filter((id) => !present.has(id));

  devLog({
    message: 'loadOrderItems',
    knownOrderIds: allOrderIds.length,
    missingInPg: missingOrderIds.length,
  });

  if (missingOrderIds.length === 0) return;

  const { items, failedOrderIds } = await getOrderItemsBatch(missingOrderIds);
  devLog({
    message: 'loadOrderItems fetched',
    fetchedItems: items.length,
    failedOrderIds: failedOrderIds.length,
  });

  if (items.length === 0) return;

  const rows = items.map((item) =>
    mapItemToPgRow({ orderId: item.order_id, item })
  );

  const result = await prisma.orderItem.createMany({
    data: rows,
    skipDuplicates: true,
  });
  devLog({ message: `Loaded ${result.count} new order items` });
}

if (process.env.ENV === 'TEST') {
  devLog({ message: 'Running loadOrderItems in TEST mode...' });
  await remonlineTokenToEnv(true);
  await loadOrderItems();
}
