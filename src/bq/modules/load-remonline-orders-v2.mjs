import { getOrdersV2 } from '../../remonline/remonline.utils.mjs';
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
import { ordersV2TableSchema } from '../schemas.mjs';
import { synchronizeRemonlineOrders } from '../bq-queries.mjs';

const DATASET_ID = 'RemOnline';
const ORDERS_TABLE_ID = 'orders_v2';
const ENTITY_NAME = 'Order';

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

function pickClientName(client) {
  if (!client) return null;
  if (client.name) return client.name;
  const parts = [client.first_name, client.last_name].filter(Boolean);
  return parts.length ? parts.join(' ') : null;
}

function jsonOrNull(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object' && Object.keys(value).length === 0) return null;
  return JSON.stringify(value);
}

export function mapOrderToBQRow(order) {
  const status = order.status || {};
  const orderType = order.order_type || {};
  const asset = order.asset || {};
  const client = order.client || {};
  const payer = order.payer || null;
  const resource = order.resource || null;

  return {
    id: order.id,
    number: order.number ?? null,
    status_id: status.id ?? null,
    status_name: status.name ?? null,
    status_overdue: order.status_overdue ?? null,
    created_at: isoOrNull(order.created_at),
    created_by_id: order.created_by_id ?? null,
    modified_at: isoOrNull(order.modified_at),
    done_at: isoOrNull(order.done_at),
    closed_at: isoOrNull(order.closed_at),
    closed_by_id: order.closed_by_id ?? null,
    branch_id: order.branch_id ?? null,
    order_type_id: orderType.id ?? null,
    order_type_name: orderType.name ?? null,
    manager_id: order.manager_id ?? null,
    assignee_id: order.assignee_id ?? null,
    asset_id: asset.id ?? null,
    asset_uid: asset.uid ?? null,
    asset_brand: asset.brand ?? null,
    asset_model: asset.model ?? null,
    asset_year: asset.year ?? null,
    client_id: client.id ?? null,
    client_name: pickClientName(client),
    client_is_organization: client.is_organization ?? null,
    payer_id: payer?.id ?? null,
    payer_name: payer ? pickClientName(payer) : null,
    scheduled_for: isoOrNull(order.scheduled_for),
    scheduled_to: isoOrNull(order.scheduled_to),
    resource_id: resource?.id ?? null,
    resource_name: resource?.name ?? null,
    malfunction: order.malfunction ?? null,
    manager_notes: order.manager_notes ?? null,
    engineer_notes: order.engineer_notes ?? null,
    address: order.address ?? null,
    resume: order.resume ?? null,
    estimated_price: toFloat(order.estimated_price),
    due_date: isoOrNull(order.due_date),
    overdue: order.overdue ?? null,
    discount_sum: toFloat(order.discount_sum),
    payed: toFloat(order.payed),
    total: toFloat(order.total),
    warranty_date: isoOrNull(order.warranty_date),
    urgent: order.urgent ?? null,
    is_deduction_required: order.is_deduction_required ?? null,
    ad_campaign_id: order.ad_campaign_id ?? null,
    custom_fields: jsonOrNull(order.custom_fields),
    asset_custom_fields: jsonOrNull(asset.custom_fields),
    client_custom_fields: jsonOrNull(client.custom_fields),
  };
}

export async function loadRemonlineOrdersV2() {
  const time = new Date();
  const sync = await getEntitySync(ENTITY_NAME);
  const modifiedAtFrom = sync.last_modified_at || undefined;

  const { orders, count } = await getOrdersV2({
    modifiedAtFrom,
    sort: 'modified_at',
  });

  console.log({
    time,
    message: 'loadRemonlineOrdersV2',
    modifiedAtFrom,
    fetchedCount: count,
    ordersLength: orders.length,
  });

  if (orders.length === 0) return;

  const rows = orders.map(mapOrderToBQRow);
  const orderIds = rows.map((r) => r.id);

  try {
    await deleteRowsByParameter({
      arrayToDelete: orderIds,
      parameter: 'id',
      table_id: ORDERS_TABLE_ID,
      dataset_id: DATASET_ID,
    });
    await loadRowsViaJSONFile({
      dataset_id: DATASET_ID,
      table_id: ORDERS_TABLE_ID,
      rows,
      schema: ordersV2TableSchema,
    });
  } catch (errors) {
    const list = Array.isArray(errors) ? errors : [errors];
    for (const err of list) {
      console.error({
        function: 'loadRemonlineOrdersV2',
        status: err?.status,
        reason: err?.reason ?? err?.message,
      });
    }
    throw errors;
  }

  await synchronizeRemonlineOrders({
    orders: rows.map((r) => ({ id: r.id, modified_at: r.modified_at })),
  });

  // Items invalidation no longer happens here — load-remonline-order-items
  // watches its own EntitySync watermark against per-order modified_at and
  // refetches whenever the order's modified_at advances past it.
  const maxModifiedAt = rows
    .map((r) => r.modified_at)
    .filter(Boolean)
    .sort()
    .pop();
  if (maxModifiedAt) {
    await upsertEntitySync(ENTITY_NAME, { last_modified_at: maxModifiedAt });
  }
}

export async function createOrResetOrdersV2Table() {
  await createOrResetTableByName({
    bqTableId: ORDERS_TABLE_ID,
    schema: ordersV2TableSchema,
    dataSetId: DATASET_ID,
  });
}

if (process.env.ENV === 'TEST') {
  console.log('running loadRemonlineOrdersV2 in TEST mode...');
  await remonlineTokenToEnv(true);
  createOrResetOrdersV2Table();
  await loadRemonlineOrdersV2();
}
