import { getOrderItemsBatch } from '../remonline.utils.mjs';
import prisma from '../remonline.prisma.mjs';
import { chunkArray, devLog } from '../../shared/shared.utils.mjs';
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
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
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

async function processOrdersChunk(chunkOrders) {
  const sync = await getEntitySync(ENTITY_NAME);
  const existingLastModifiedAt = sync.last_modified_at || null;
  const existingFailedOrderIds = Array.isArray(sync.failed_order_ids)
    ? sync.failed_order_ids
    : [];

  const chunkOrderIds = chunkOrders.map((order) => order.id);

  const { items, failedOrderIds: chunkFailedOrderIds } =
    await getOrderItemsBatch(chunkOrderIds);

  const chunkFailedOrderIdSet = new Set(chunkFailedOrderIds);
  const successOrderIds = chunkOrderIds.filter(
    (orderId) => !chunkFailedOrderIdSet.has(orderId)
  );

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
  }

  const chunkWatermark = chunkOrders.reduce((maxModifiedAt, order) => {
    if (!order.modifiedAt) return maxModifiedAt;
    if (!maxModifiedAt || order.modifiedAt > maxModifiedAt) {
      return order.modifiedAt;
    }
    return maxModifiedAt;
  }, null);

  const successOrderIdSet = new Set(successOrderIds);
  const mergedFailedOrderIds = [
    ...existingFailedOrderIds.filter(
      (orderId) => !successOrderIdSet.has(orderId)
    ),
    ...chunkFailedOrderIds.filter(
      (orderId) => !existingFailedOrderIds.includes(orderId)
    ),
  ];

  const newLastModifiedAt =
    chunkWatermark &&
    (!existingLastModifiedAt ||
      chunkWatermark > new Date(existingLastModifiedAt))
      ? chunkWatermark.toISOString().replace(/\.\d{3}Z$/, 'Z')
      : existingLastModifiedAt;

  await upsertEntitySync(ENTITY_NAME, {
    last_modified_at: newLastModifiedAt,
    failed_order_ids: mergedFailedOrderIds,
  });

  return {
    itemsSaved: items.length,
    chunkFailedOrderIds,
    lastModifiedAt: newLastModifiedAt,
  };
}

export async function loadOrderItems() {
  const time = new Date();
  devLog({ time, message: 'loadOrderItems' });

  const sync = await getEntitySync(ENTITY_NAME);
  const initialLastModifiedAt = sync.last_modified_at || null;
  const failedOrderIdsToRetry = Array.isArray(sync.failed_order_ids)
    ? sync.failed_order_ids
    : [];

  const upsertedOrders = await prisma.order.findMany({
    where: initialLastModifiedAt
      ? { modifiedAt: { gt: new Date(initialLastModifiedAt) } }
      : {},
    select: { id: true, modifiedAt: true },
    orderBy: { modifiedAt: 'asc' },
  });

  const upsertedOrderIdSet = new Set(upsertedOrders.map((order) => order.id));
  const retryOrderIds = failedOrderIdsToRetry.filter(
    (orderId) => !upsertedOrderIdSet.has(orderId)
  );

  const allOrders = [
    ...retryOrderIds.map((orderId) => ({ id: orderId, modifiedAt: null })),
    ...upsertedOrders,
  ];

  if (allOrders.length === 0) {
    devLog({
      message: 'loadOrderItems: no orders past watermark, skipping',
      lastModifiedAt: initialLastModifiedAt,
    });
    return;
  }

  devLog({
    message: 'loadOrderItems starting',
    lastModifiedAt: initialLastModifiedAt,
    ordersToProcess: allOrders.length,
    retryCount: retryOrderIds.length,
    chunkSize: ORDERS_CHUNK_SIZE,
  });

  let totalItemsSaved = 0;
  let totalFailedOrderIds = 0;
  let lastChunkLastModifiedAt = initialLastModifiedAt;

  const orderChunks = chunkArray(allOrders, ORDERS_CHUNK_SIZE);
  for (const [chunkOffset, chunkOrders] of orderChunks.entries()) {
    const chunkIndex = chunkOffset + 1;

    const { itemsSaved, chunkFailedOrderIds, lastModifiedAt } =
      await processOrdersChunk(chunkOrders);

    totalItemsSaved += itemsSaved;
    totalFailedOrderIds += chunkFailedOrderIds.length;
    lastChunkLastModifiedAt = lastModifiedAt;

    devLog({
      message: 'loadOrderItems chunk saved',
      chunkIndex,
      chunkOrders: chunkOrders.length,
      itemsSaved,
      chunkFailedIds: chunkFailedOrderIds.length,
      totalItemsSaved,
      lastModifiedAt,
    });
  }

  devLog({
    message: 'loadOrderItems done',
    totalItemsSaved,
    totalFailedOrderIds,
    lastModifiedAt: lastChunkLastModifiedAt,
  });
}
