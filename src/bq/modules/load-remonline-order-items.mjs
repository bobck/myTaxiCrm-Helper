import { getOrderItemsBatch } from '../../remonline/remonline.utils.mjs';
import { remonlineTokenToEnv } from '../../remonline/remonline.api.mjs';
import {
  getEntitySync,
  upsertEntitySync,
} from '../../remonline/remonline.queries.mjs';
import {
  createOrResetTableByName,
  deleteRowsByParameter,
  getOrderIdsModifiedAfterFromBQ,
  loadRowsViaJSONFile,
} from '../bq-utils.mjs';
import { orderItemsTableSchema } from '../schemas.mjs';
import { chunkArray } from '../../shared/shared.utils.mjs';

const DATASET_ID = 'RemOnline';
const TABLE_ID = 'order_items';
const ENTITY_NAME = 'OrderItem';
const ORDERS_CHUNK_SIZE = 5000;

function isoOrNull(value) {
  if (!value) return null;
  if (!Number.isFinite(Date.parse(value))) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00:00Z`;
  return value;
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

export function mapItemToBQRow({ orderId, item }) {
  const entity = item.entity || {};
  const uom = entity.uom || {};
  const discount = item.discount || {};
  const warranty = item.warranty || {};

  return {
    order_id: orderId,
    id: item.id,
    created_at: isoOrNull(item.created_at),
    assignee_id: item.assignee_id ?? null,
    entity_id: entity.id ?? null,
    entity_type: entity.type ?? null,
    entity_title: entity.title ?? null,
    entity_code: entity.code ?? null,
    entity_sku: entity.sku ?? null,
    entity_description: entity.description ?? null,
    entity_sn_accounting: entity.sn_accounting ?? null,
    entity_is_hidden: entity.is_hidden ?? null,
    uom_id: uom.id ?? null,
    uom_title: uom.title ?? null,
    uom_description: uom.description ?? null,
    quantity: toFloat(item.quantity),
    price: toFloat(item.price),
    cost: toFloat(item.cost),
    margin_id: item.margin_id ?? null,
    is_deduction_required: item.is_deduction_required ?? null,
    is_refunded: item.is_refunded ?? null,
    comment: item.comment ?? null,
    comment_visibility: item.comment_visibility ?? null,
    discount_type: discount.type ?? null,
    discount_percentage: toFloat(discount.percentage),
    discount_amount: toFloat(discount.amount),
    discount_sponsor: discount.sponsor ?? null,
    warranty_period: warranty.period ?? null,
    warranty_period_units: warranty.period_units ?? warranty.unit ?? null,
    expiration_date: isoOrNull(item.expiration_date),
    taxes: jsonOrNull(item.taxes),
    write_offs: jsonOrNull(item.write_offs),
  };
}

async function processOrdersChunk(chunkOrders) {
  const sync = await getEntitySync(ENTITY_NAME);
  const existingLastModifiedAt = sync.last_modified_at || null;
  const existingFailedOrderIds = Array.isArray(sync.failed_order_ids)
    ? sync.failed_order_ids
    : [];

  const chunkOrderIds = chunkOrders.map((order) => order.order_id);

  const { items, failedOrderIds: chunkFailedOrderIds } =
    await getOrderItemsBatch(chunkOrderIds);

  const chunkFailedOrderIdSet = new Set(chunkFailedOrderIds);
  const successOrderIds = chunkOrderIds.filter(
    (orderId) => !chunkFailedOrderIdSet.has(orderId)
  );

  if (successOrderIds.length > 0) {
    await deleteRowsByParameter({
      arrayToDelete: successOrderIds,
      parameter: 'order_id',
      table_id: TABLE_ID,
      dataset_id: DATASET_ID,
    });

    const rows = items.map((item) =>
      mapItemToBQRow({ orderId: item.order_id, item })
    );
    if (rows.length > 0) {
      await loadRowsViaJSONFile({
        dataset_id: DATASET_ID,
        table_id: TABLE_ID,
        rows,
        schema: orderItemsTableSchema,
      });
    }
  }

  const chunkWatermark = chunkOrders.reduce((maxModifiedAt, order) => {
    if (!order.modified_at) return maxModifiedAt;
    if (
      !maxModifiedAt ||
      Date.parse(order.modified_at) > Date.parse(maxModifiedAt)
    )
      return order.modified_at;
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
      Date.parse(chunkWatermark) > Date.parse(existingLastModifiedAt))
      ? chunkWatermark
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

export async function loadRemonlineOrderItems() {
  const time = new Date();

  /**
   * orderItemSync={
   *  entityName:"OrderItem",
   *  syncDetails:{
   *    last_modified_at: Date,
   *    failed_order_ids: number[]
   *  }
   * }
   */
  const sync = await getEntitySync(ENTITY_NAME);
  const initialLastModifiedAt = sync.last_modified_at || null;
  const failedOrderIdsToRetry = Array.isArray(sync.failed_order_ids)
    ? sync.failed_order_ids
    : [];

  const upsertedOrders = await getOrderIdsModifiedAfterFromBQ(
    initialLastModifiedAt
  );
  const upsertedOrderIdSet = new Set(
    upsertedOrders.map((order) => order.order_id)
  );

  const retryOrderIds = failedOrderIdsToRetry.filter(
    (orderId) => !upsertedOrderIdSet.has(orderId)
  );

  const allOrders = [
    ...retryOrderIds.map((orderId) => ({
      order_id: orderId,
      modified_at: null,
    })),
    ...upsertedOrders,
  ];

  if (allOrders.length === 0) {
    console.log({
      time,
      message: 'loadRemonlineOrderItems: no orders past watermark, skipping',
      lastModifiedAt: initialLastModifiedAt,
    });
    return;
  }

  console.log({
    time,
    message: 'loadRemonlineOrderItems starting',
    lastModifiedAt: initialLastModifiedAt,
    ordersToProcess: allOrders.length,
    retryCount: retryOrderIds.length,
    chunkSize: ORDERS_CHUNK_SIZE,
  });

  let totalItemsSaved = 0;
  let totalFailedOrderIds = 0;
  let lastChunkLastModifiedAt = initialLastModifiedAt;

  try {
    const orderChunks = chunkArray(allOrders, ORDERS_CHUNK_SIZE);
    for (const [chunkOffset, chunkOrders] of orderChunks.entries()) {
      const chunkIndex = chunkOffset + 1;

      const { itemsSaved, chunkFailedOrderIds, lastModifiedAt } =
        await processOrdersChunk(chunkOrders);

      totalItemsSaved += itemsSaved;
      totalFailedOrderIds += chunkFailedOrderIds.length;
      lastChunkLastModifiedAt = lastModifiedAt;

      console.log({
        time: new Date(),
        message: 'loadRemonlineOrderItems chunk saved',
        chunkIndex,
        chunkOrders: chunkOrders.length,
        itemsSaved,
        chunkFailedIds: chunkFailedOrderIds.length,
        totalItemsSaved,
        lastModifiedAt,
      });
    }
  } catch (errors) {
    const errorList = Array.isArray(errors) ? errors : [errors];
    for (const error of errorList) {
      console.error({
        function: 'loadRemonlineOrderItems',
        status: error?.status,
        reason: error?.reason ?? error?.message,
      });
    }
    throw errors;
  }

  console.log({
    time: new Date(),
    message: 'loadRemonlineOrderItems done',
    totalItemsSaved,
    totalFailedOrderIds,
    lastModifiedAt: lastChunkLastModifiedAt,
  });
}

export async function createOrResetOrderItemsTable() {
  await createOrResetTableByName({
    bqTableId: TABLE_ID,
    schema: orderItemsTableSchema,
    dataSetId: DATASET_ID,
  });
}

if (process.env.ENV === 'TEST') {
  console.log('running loadRemonlineOrderItems in TEST mode...');
  await remonlineTokenToEnv(true);
  await loadRemonlineOrderItems();
}
