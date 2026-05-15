import { getOrdersV2 } from '../remonline.utils.mjs';
import prisma from '../remonline.prisma.mjs';
import {
  devLog,
  isoOrNull,
  jsonOrNull,
  toFloat,
} from '../../shared/shared.utils.mjs';
import { getEntitySync } from '../remonline.queries.mjs';

const ENTITY_NAME = 'Order';

const BATCH_PAGES_LIMIT = 50;

function pickClientName(client) {
  if (!client) return null;
  if (client.name) return client.name;
  const parts = [client.first_name, client.last_name].filter(Boolean);
  return parts.length ? parts.join(' ') : null;
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
  const orderIds = rows.map((row) => row.id);

  const maxModifiedAt = rows.reduce((max, row) => {
    if (!row.modifiedAt) return max;
    if (!max || row.modifiedAt > max) return row.modifiedAt;
    return max;
  }, null);

  const transactionOps = [
    prisma.order.deleteMany({ where: { id: { in: orderIds } } }),
    prisma.order.createMany({ data: rows }),
  ];
  if (maxModifiedAt) {
    const syncDetails = {
      last_modified_at: maxModifiedAt
        .toISOString()
        .replace(/\.\d{3}Z$/, 'Z'),
    };
    transactionOps.push(
      prisma.entitySync.upsert({
        where: { entityName: ENTITY_NAME },
        create: { entityName: ENTITY_NAME, syncDetails },
        update: { syncDetails },
      })
    );
  }
  await prisma.$transaction(transactionOps);

  return rows.length;
}

export async function loadOrders({ pageLimit } = {}) {
  console.log({ time: new Date(), message: 'loadOrders start' });

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
      try {
        const saved = await saveOrdersBatch(currentBatch);
        totalSaved += saved;
        devLog({
          message: `loadOrders batch saved at page ${page}`,
          savedInBatch: saved,
          totalSaved,
        });
      } catch (error) {
        console.error({
          message: 'loadOrders batch failed',
          page,
          batchSize: currentBatch.length,
          totalSavedBeforeFailure: totalSaved,
          error,
        });
        throw error;
      }
      currentBatch = [];
      currentBatchPages = 0;
    }
  }

  if (currentBatch.length > 0) {
    try {
      const saved = await saveOrdersBatch(currentBatch);
      totalSaved += saved;
      devLog({
        message: `loadOrders final batch saved at page ${lastPage}`,
        savedInBatch: saved,
        totalSaved,
      });
    } catch (error) {
      console.error({
        message: 'loadOrders final batch failed',
        lastPage,
        batchSize: currentBatch.length,
        totalSavedBeforeFailure: totalSaved,
        error,
      });
      throw error;
    }
  }

  console.log({
    message: 'loadOrders done',
    modifiedAtFrom,
    totalSaved,
    lastPage,
  });
}
