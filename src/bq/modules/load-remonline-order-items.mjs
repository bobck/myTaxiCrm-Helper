import { getOrderItemsBatch } from '../../remonline/remonline.utils.mjs';
import { remonlineTokenToEnv } from '../../remonline/remonline.api.mjs';
import {
  getEntitySync,
  upsertEntitySync,
} from '../../remonline/remonline.queries.mjs';
import {
  createOrResetTableByName,
  deleteRowsByParameter,
  loadRowsViaJSONFile,
} from '../bq-utils.mjs';
import { orderItemsTableSchema } from '../schemas.mjs';
import { getOrderIdsModifiedAfter } from '../bq-queries.mjs';

const DATASET_ID = 'RemOnline';
const TABLE_ID = 'order_items';
const ENTITY_NAME = 'OrderItem';

function isoOrNull(value) {
  if (!value) return null;
  if (!Number.isFinite(Date.parse(value))) return null;
  // Date-only ('YYYY-MM-DD') → pad to UTC midnight so BQ TIMESTAMP accepts it.
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
  return JSON.stringify(value);
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

export async function loadRemonlineOrderItems() {
  const time = new Date();

  // Watermark = max(modified_at) of orders whose items we've already synced.
  // First run (no row) → empty object → fetch items for every known order.
  const sync = await getEntitySync(ENTITY_NAME);
  const lastModifiedAt = sync.last_modified_at || null;

  const orders = await getOrderIdsModifiedAfter(lastModifiedAt);
  if (orders.length === 0) {
    console.log({
      time,
      message: 'loadRemonlineOrderItems: no orders past watermark, skipping',
      lastModifiedAt,
    });
    return;
  }

  const orderIds = orders.map((o) => o.order_id);

  console.log({
    time,
    message: 'loadRemonlineOrderItems',
    lastModifiedAt,
    ordersToProcess: orderIds.length,
  });

  const { items, failedOrderIds } = await getOrderItemsBatch(orderIds);

  console.log({
    time: new Date(),
    message: 'loadRemonlineOrderItems: fetched items',
    fetchedItems: items.length,
    failedOrderIds: failedOrderIds.length,
  });

  const failedSet = new Set(failedOrderIds);
  const successOrders = orders.filter((o) => !failedSet.has(o.order_id));

  if (successOrders.length === 0) {
    console.log({
      time: new Date(),
      message: 'loadRemonlineOrderItems: nothing succeeded, watermark unchanged',
    });
    return;
  }

  const successIds = successOrders.map((o) => o.order_id);

  try {
    // Stale rows from a previous sync of these same orders. Safe to delete
    // even when `items` is empty — clears items for orders that lost lines.
    await deleteRowsByParameter({
      arrayToDelete: successIds,
      parameter: 'order_id',
      table_id: TABLE_ID,
      dataset_id: DATASET_ID,
    });

    if (items.length > 0) {
      const rows = items
        .filter((item) => !failedSet.has(item.order_id))
        .map((item) => mapItemToBQRow({ orderId: item.order_id, item }));
      await loadRowsViaJSONFile({
        dataset_id: DATASET_ID,
        table_id: TABLE_ID,
        rows,
        schema: orderItemsTableSchema,
      });
    }
  } catch (errors) {
    const list = Array.isArray(errors) ? errors : [errors];
    for (const err of list) {
      console.error({
        function: 'loadRemonlineOrderItems',
        status: err?.status,
        reason: err?.reason ?? err?.message,
      });
    }
    throw errors;
  }

  // `orders` is sorted ASC by modified_at. Advance the watermark up to (but
  // not past) the first failure so retries keep working. Skipping that
  // invariant would silently drop any failed order whose modified_at lies
  // below a later success.
  let newWatermark = null;
  for (const o of orders) {
    if (failedSet.has(o.order_id)) break;
    if (o.modified_at) newWatermark = o.modified_at;
  }
  if (newWatermark) {
    await upsertEntitySync(ENTITY_NAME, { last_modified_at: newWatermark });
  }
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
  await createOrResetOrderItemsTable();
  await loadRemonlineOrderItems();
}
