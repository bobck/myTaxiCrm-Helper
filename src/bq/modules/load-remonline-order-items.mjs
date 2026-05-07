import { getOrderItemsBatch } from '../../remonline/remonline.utils.mjs';
import { remonlineTokenToEnv } from '../../remonline/remonline.api.mjs';
import {
  createOrResetTableByName,
  getMissingIdsInTable,
  loadRowsViaJSONFile,
} from '../bq-utils.mjs';
import { orderItemsTableSchema } from '../schemas.mjs';
import { getAllRemonlineOrderIds } from '../bq-queries.mjs';

const DATASET_ID = 'RemOnline';
const TABLE_ID = 'order_items';

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

  const allOrderIds = (await getAllRemonlineOrderIds());
  if (allOrderIds.length === 0) {
    console.log({
      time,
      message: 'loadRemonlineOrderItems: no orders in sqlite, skipping',
    });
    return;
  }

  const missingOrderIds = await getMissingIdsInTable({
    dataset_id: DATASET_ID,
    table_id: TABLE_ID,
    parameter: 'order_id',
    allIds: allOrderIds,
  });

  console.log({
    time,
    message: 'loadRemonlineOrderItems',
    knownOrderIds: allOrderIds.length,
    missingInBQ: missingOrderIds.length,
  });

  if (missingOrderIds.length === 0) return;

  const { items, failedOrderIds } = await getOrderItemsBatch(missingOrderIds);

  console.log({
    time: new Date(),
    message: 'loadRemonlineOrderItems: fetched items',
    fetchedItems: items.length,
    failedOrderIds: failedOrderIds.length,
  });

  if (items.length === 0) return;

  const rows = items.map((item) =>
    mapItemToBQRow({ orderId: item.order_id, item })
  );

  try {
    await loadRowsViaJSONFile({
      dataset_id: DATASET_ID,
      table_id: TABLE_ID,
      rows,
      schema: orderItemsTableSchema,
    });
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
