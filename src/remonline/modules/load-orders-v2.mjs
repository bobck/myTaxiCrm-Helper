import { getOrdersV2 } from '../remonline.utils.mjs';
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

export async function loadOrdersV2() {
  const time = new Date();
  devLog({ time, message: 'loadOrdersV2' });

  const lastOrder = await prisma.order.findFirst({
    orderBy: { modifiedAt: 'desc' },
    select: { modifiedAt: true },
  });
  const modifiedAtFrom = lastOrder?.modifiedAt
    ? new Date(lastOrder.modifiedAt.getTime() + 1000)
        .toISOString()
        .replace(/\.\d{3}Z$/, 'Z')
    : undefined;

  const { orders, count } = await getOrdersV2({
    modifiedAtFrom,
    sort: 'modified_at',
  });
  devLog({
    message: 'loadOrdersV2 fetched',
    modifiedAtFrom,
    fetchedCount: count,
  });

  if (orders.length === 0) return;

  const rows = orders.map(mapOrderToPgRow);
  const orderIds = rows.map((r) => r.id);

  await prisma.$transaction([
    prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } }),
    prisma.order.deleteMany({ where: { id: { in: orderIds } } }),
    prisma.order.createMany({ data: rows }),
  ]);

  devLog({
    message: `loadOrdersV2 synced ${rows.length} orders, invalidated their items.`,
  });
}

if (process.env.ENV === 'TEST') {
  devLog({ message: 'Running loadOrdersV2 in TEST mode...' });
  await remonlineTokenToEnv(true);
  await loadOrdersV2();
}
