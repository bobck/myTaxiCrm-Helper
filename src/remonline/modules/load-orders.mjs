import { getOrdersV2 } from '../remonline.utils.mjs';
import prisma from '../remonline.prisma.mjs';
import { devLog } from '../../shared/shared.utils.mjs';
import { getEntitySync, upsertEntitySync } from '../remonline.queries.mjs';

const ENTITY_NAME = 'Order';

const BATCH_PAGES_LIMIT = 50;

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

function pickClientName(client) {
  if (!client) return null;
  if (client.name) return client.name;
  const parts = [client.first_name, client.last_name].filter(Boolean);
  return parts.length ? parts.join(' ') : null;
}

function jsonOrNull(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object' && Object.keys(value).length === 0) return null;
  return value;
}

function mapOrderToPgRow(order) {
  const status = order.status || {};
  const orderType = order.order_type || {};
  const asset = order.asset || {};
  const client = order.client || {};
  const payer = order.payer || null;
  const resource = order.resource || null;

  return {
    id: order.id,
    number: order.number ?? null,
    statusId: status.id ?? null,
    statusName: status.name ?? null,
    statusOverdue: order.status_overdue ?? null,
    createdAt: isoOrNull(order.created_at),
    createdById: order.created_by_id ?? null,
    modifiedAt: isoOrNull(order.modified_at),
    doneAt: isoOrNull(order.done_at),
    closedAt: isoOrNull(order.closed_at),
    closedById: order.closed_by_id ?? null,
    branchId: order.branch_id ?? null,
    orderTypeId: orderType.id ?? null,
    orderTypeName: orderType.name ?? null,
    managerId: order.manager_id ?? null,
    assigneeId: order.assignee_id ?? null,
    assetId: asset.id ?? null,
    assetUid: asset.uid ?? null,
    assetBrand: asset.brand ?? null,
    assetModel: asset.model ?? null,
    assetYear: asset.year ?? null,
    clientId: client.id ?? null,
    clientName: pickClientName(client),
    clientIsOrganization: client.is_organization ?? null,
    payerId: payer?.id ?? null,
    payerName: payer ? pickClientName(payer) : null,
    scheduledFor: isoOrNull(order.scheduled_for),
    scheduledTo: isoOrNull(order.scheduled_to),
    resourceId: resource?.id ?? null,
    resourceName: resource?.name ?? null,
    malfunction: order.malfunction ?? null,
    managerNotes: order.manager_notes ?? null,
    engineerNotes: order.engineer_notes ?? null,
    address: order.address ?? null,
    resume: order.resume ?? null,
    estimatedPrice: toFloat(order.estimated_price),
    dueDate: isoOrNull(order.due_date),
    overdue: order.overdue ?? null,
    discountSum: toFloat(order.discount_sum),
    payed: toFloat(order.payed),
    total: toFloat(order.total),
    warrantyDate: isoOrNull(order.warranty_date),
    urgent: order.urgent ?? null,
    isDeductionRequired: order.is_deduction_required ?? null,
    adCampaignId: order.ad_campaign_id ?? null,
    customFields: jsonOrNull(order.custom_fields),
    assetCustomFields: jsonOrNull(asset.custom_fields),
    clientCustomFields: jsonOrNull(client.custom_fields),
  };
}

async function saveOrdersBatch(orders) {
  if (orders.length === 0) return 0;

  const rows = orders.map(mapOrderToPgRow);
  const orderIds = rows.map((r) => r.id);

  await prisma.$transaction([
    prisma.order.deleteMany({ where: { id: { in: orderIds } } }),
    prisma.order.createMany({ data: rows }),
  ]);

  const maxModifiedAt = rows.reduce((max, r) => {
    if (!r.modifiedAt) return max;
    if (!max || r.modifiedAt > max) return r.modifiedAt;
    return max;
  }, null);
  if (maxModifiedAt) {
    const iso = maxModifiedAt.toISOString().replace(/\.\d{3}Z$/, 'Z');
    await upsertEntitySync(ENTITY_NAME, { last_modified_at: iso });
  }

  return rows.length;
}

export async function loadOrders({ pageLimit } = {}) {
  const time = new Date();
  devLog({ time, message: 'loadOrders' });

  const sync = await getEntitySync(ENTITY_NAME);
  const modifiedAtFrom = sync.last_modified_at || undefined;

  let currentBatch = [];
  let currentBatchPages = 0;
  let totalSaved = 0;
  let lastPage = 0;

  for await (const { orders, page } of getOrdersV2({
    modifiedAtFrom,
    sort: 'modified_at',
    pageLimit,
  })) {
    lastPage = page;
    if (orders.length > 0) currentBatch.push(...orders);
    currentBatchPages += 1;

    if (currentBatchPages >= BATCH_PAGES_LIMIT) {
      const saved = await saveOrdersBatch(currentBatch);
      totalSaved += saved;
      devLog({
        message: `loadOrders batch saved at page ${page}`,
        savedInBatch: saved,
        totalSaved,
      });
      currentBatch = [];
      currentBatchPages = 0;
    }
  }

  if (currentBatch.length > 0) {
    const saved = await saveOrdersBatch(currentBatch);
    totalSaved += saved;
    devLog({
      message: `loadOrders final batch saved at page ${lastPage}`,
      savedInBatch: saved,
      totalSaved,
    });
  }

  devLog({
    message: 'loadOrders done',
    modifiedAtFrom,
    totalSaved,
    lastPage,
  });
}
