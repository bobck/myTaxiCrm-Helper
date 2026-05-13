// Подгружает позиции (items) заказов из roapp.io v2 API в Postgres.
// Дискавери — заказы из PG с `modifiedAt > watermark` из `entity_sync('OrderItem')`.
// Ожидается, что джоба сначала прогоняет `loadOrders` (он двигает watermark
// `entity_sync('Order')` и подкладывает новые/обновлённые заказы в PG),
// а потом этот модуль на основании их `modifiedAt` решает, у кого тянуть items.
import { getOrderItems } from '../remonline.utils.mjs';
import prisma from '../remonline.prisma.mjs';
import { devLog } from '../../shared/shared.utils.mjs';
import { getEntitySync, upsertEntitySync } from '../remonline.queries.mjs';

const ENTITY_NAME = 'OrderItem';

const ORDERS_CHUNK_SIZE = 500;

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
  return value;
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

async function processChunk(orders) {
  const successOrderIds = [];
  const items = [];
  let lastFullyProcessedOrder = null;
  let failedOrderId = null;

  for (const order of orders) {
    let orderItems;
    try {
      orderItems = await getOrderItems(order.id);
    } catch (e) {
      console.error({
        function: 'loadOrderItems',
        orderId: order.id,
        status: e?.status,
        message: e?.message,
      });
      failedOrderId = order.id;
      break;
    }

    successOrderIds.push(order.id);
    for (const item of orderItems) {
      items.push({ order_id: order.id, ...item });
    }
    lastFullyProcessedOrder = order;
  }

  if (successOrderIds.length > 0) {
    const rows = items.map((item) =>
      mapItemToPgRow({ orderId: item.order_id, item })
    );
    await prisma.$transaction([
      prisma.orderItem.deleteMany({
        where: { orderId: { in: successOrderIds } },
      }),
      prisma.orderItem.createMany({ data: rows }),
    ]);

    if (lastFullyProcessedOrder?.modifiedAt) {
      const iso = lastFullyProcessedOrder.modifiedAt
        .toISOString()
        .replace(/\.\d{3}Z$/, 'Z');
      await upsertEntitySync(ENTITY_NAME, { last_modified_at: iso });
    }
  }

  return {
    savedOrders: successOrderIds.length,
    savedItems: items.length,
    failedOrderId,
  };
}

export async function loadOrderItems() {
  const time = new Date();
  devLog({ time, message: 'loadOrderItems' });

  let totalOrders = 0;
  let totalItems = 0;

  while (true) {
    const sync = await getEntitySync(ENTITY_NAME);
    const lastModifiedAt = sync.last_modified_at || null;

    const orders = await prisma.order.findMany({
      where: lastModifiedAt
        ? { modifiedAt: { gt: new Date(lastModifiedAt) } }
        : {},
      select: { id: true, modifiedAt: true },
      orderBy: { modifiedAt: 'asc' },
      take: ORDERS_CHUNK_SIZE,
    });

    if (orders.length === 0) {
      devLog({
        message: 'loadOrderItems: no more orders past watermark',
        lastModifiedAt,
      });
      break;
    }

    devLog({
      message: 'loadOrderItems chunk',
      lastModifiedAt,
      ordersInChunk: orders.length,
    });

    const { savedOrders, savedItems, failedOrderId } =
      await processChunk(orders);
    totalOrders += savedOrders;
    totalItems += savedItems;

    devLog({
      message: 'loadOrderItems chunk saved',
      savedOrders,
      savedItems,
      totalOrders,
      totalItems,
    });

    // On a fetch failure inside the chunk, watermark stopped at the last
    // successful order. Bailing here lets the next tick retry the failing
    // order rather than blocking on it indefinitely.
    if (failedOrderId !== null) {
      devLog({
        message: 'loadOrderItems: stopping after first failed order',
        failedOrderId,
      });
      break;
    }
  }

  devLog({ message: 'loadOrderItems done', totalOrders, totalItems });
}

// TEST-запуск переехал в `src/remonline/jobs/load-orders-job.mjs`,
// чтобы один тик последовательно прогонял orders + items.
