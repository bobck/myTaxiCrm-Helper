import { getOrders } from '../remonline.utils.mjs';
import prisma from '../remonline.prisma.mjs';
import { devLog } from '../../shared/shared.utils.mjs';
import { remonlineTokenToEnv } from '../remonline.api.mjs';

const CHUNK_SIZE = 1000;
const TX_TIMEOUT_MS = 10 * 60 * 1000;
const TX_MAX_WAIT_MS = 15_000;

const toBigInt = (v) => (v == null ? null : BigInt(v));

async function getMaxOrderModifiedAt() {
  const r = await prisma.order.aggregate({ _max: { modifiedAt: true } });
  return r._max.modifiedAt;
}

function buildPayload({ orders }) {
  const ordersRows = [];
  const partsRows = [];
  const operationsRows = [];
  const attachmentsRows = [];
  const resourceMap = new Map();
  const linksRows = [];

  for (const order of orders) {
    const {
      id,
      uuid,
      created_at,
      modified_at,
      done_at,
      scheduled_for,
      warranty_date,
      closed_at,
      estimated_done_at,
      duration,
      kindof_good,
      serial,
      packagelist,
      appearance,
      malfunction,
      manager_notes,
      engineer_notes,
      resume,
      payed,
      missed_payments,
      warranty_measures,
      urgent,
      discount_sum,
      estimated_cost,
      id_label,
      price,
      branch_id,
      overdue,
      status_overdue,
      manager_id,
      engineer_id,
      created_by_id,
      closed_by_id,
      brand,
      model,
      client,
      asset,
      order_type,
      status,
      ad_campaign,
      parts,
      operations,
      attachments,
      resources,
    } = order;

    const customFields = JSON.stringify({
      ...order.custom_fields,
      f3369990: asset?.f3369990,
      f3369991: asset?.f3369991,
    });

    const clientName =
      client?.name || `${client?.first_name} ${client?.last_name}`;

    const hasCampaign =
      typeof ad_campaign === 'object' &&
      ad_campaign !== null &&
      Object.keys(ad_campaign).length > 0;

    ordersRows.push({
      id,
      modifiedAt: BigInt(modified_at),
      uuid,
      createdAt: BigInt(created_at),
      doneAt: toBigInt(done_at),
      scheduledFor: toBigInt(scheduled_for),
      duration,
      kindofGood: kindof_good,
      serial,
      packagelist,
      appearance,
      malfunction,
      managerNotes: manager_notes,
      engineerNotes: engineer_notes,
      resume,
      payed,
      missedPayments: missed_payments,
      warrantyMeasures: warranty_measures,
      warrantyDate: toBigInt(warranty_date),
      urgent,
      discountSum: discount_sum,
      customFields,
      estimatedCost: estimated_cost == null ? null : String(estimated_cost),
      closedAt: toBigInt(closed_at),
      estimatedDoneAt: toBigInt(estimated_done_at),
      idLabel: id_label,
      price,
      branchId: branch_id,
      overdue,
      statusOverdue: status_overdue,
      managerId: manager_id,
      engineerId: engineer_id,
      createdById: created_by_id,
      closedById: closed_by_id,
      brand,
      model,
      clientId: client?.id,
      clientName,
      assetId: asset?.id,
      assetUid: asset?.uid,
      orderTypeId: order_type?.id,
      statusId: status?.id,
      adCampaignId: hasCampaign ? ad_campaign.id : null,
    });

    for (const p of parts || []) {
      partsRows.push({
        orderId: id,
        id: p.id,
        entityId: p.entityId,
        engineerId: p.engineerId,
        title: p.title,
        amount: p.amount,
        price: p.price,
        cost: p.cost,
        discountValue: p.discount_value,
        code: p.code,
        article: p.article,
        warranty: p.warranty,
        warrantyPeriod: p.warranty_period,
        uomId: p.uom?.id,
      });
    }

    for (const op of operations || []) {
      operationsRows.push({
        orderId: id,
        id: op.id,
        entityId: op.entityId,
        engineerId: op.engineerId,
        title: op.title,
        amount: op.amount,
        price: op.price,
        cost: op.cost,
        discountValue: op.discount_value,
        warranty: op.warranty,
        warrantyPeriod: op.warranty_period,
        uomId: op.uom?.id,
      });
    }

    for (const a of attachments || []) {
      attachmentsRows.push({
        orderId: id,
        createdAt: BigInt(a.created_at),
        createdById: a.created_by_id,
        filename: a.filename,
        url: a.url,
      });
    }

    for (const r of resources || []) {
      if (!resourceMap.has(r.id)) {
        resourceMap.set(r.id, { id: r.id, name: r.name });
      }
      linksRows.push({ resourceId: r.id, orderId: id });
    }
  }

  return {
    ordersRows,
    partsRows,
    operationsRows,
    attachmentsRows,
    resourcesRows: [...resourceMap.values()],
    linksRows,
  };
}

async function chunkedCreateMany(tx, model, rows, opts = {}) {
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    await tx[model].createMany({
      data: rows.slice(i, i + CHUNK_SIZE),
      ...opts,
    });
  }
}

export async function syncRemonlineOrders() {
  const time = new Date();
  devLog({ time, message: 'syncRemonlineOrders' });

  const maxModifiedAt = await getMaxOrderModifiedAt();
  const sort_dir = 'asc';
  const { orders, count } = await getOrders({
    modified_at: maxModifiedAt != null ? Number(maxModifiedAt) : undefined,
    sort_dir,
  });

  devLog({
    message: 'syncRemonlineOrders — fetched',
    expected: count,
    received: orders.length,
    maxModifiedAt: maxModifiedAt?.toString(),
  });

  if (orders.length === 0) return;

  const {
    ordersRows,
    partsRows,
    operationsRows,
    attachmentsRows,
    resourcesRows,
    linksRows,
  } = buildPayload({ orders });

  const orderIds = ordersRows.map((o) => o.id);

  await prisma.$transaction(
    async (tx) => {
      // cascade сметёт parts/operations/attachments/orders_to_resources
      await tx.order.deleteMany({ where: { id: { in: orderIds } } });

      await chunkedCreateMany(tx, 'order', ordersRows);
      await chunkedCreateMany(tx, 'orderPart', partsRows);
      await chunkedCreateMany(tx, 'orderOperation', operationsRows);
      await chunkedCreateMany(tx, 'orderAttachment', attachmentsRows);
      await chunkedCreateMany(tx, 'orderResource', resourcesRows, {
        skipDuplicates: true,
      });
      await chunkedCreateMany(tx, 'orderToResource', linksRows, {
        skipDuplicates: true,
      });
    },
    {
      maxWait: TX_MAX_WAIT_MS,
      timeout: TX_TIMEOUT_MS,
    }
  );

  devLog({
    message: 'syncRemonlineOrders — done',
    orders: ordersRows.length,
    parts: partsRows.length,
    operations: operationsRows.length,
    attachments: attachmentsRows.length,
    resources: resourcesRows.length,
    links: linksRows.length,
  });
}

if (process.env.ENV === 'TEST') {
  devLog('Running syncRemonlineOrders in TEST mode...');
  await remonlineTokenToEnv(true);
  await syncRemonlineOrders();
}
