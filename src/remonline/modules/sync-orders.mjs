import { getOrders } from '../remonline.utils.mjs';
import prisma from '../remonline.prisma.mjs';
import { devLog } from '../../shared/shared.utils.mjs';
import { remonlineTokenToEnv } from '../remonline.api.mjs';

const PAGE_SIZE = 50;
const PAGES_PER_BATCH = 50;
const TX_TIMEOUT_MS = 10 * 60 * 1000;
const TX_MAX_WAIT_MS = 15_000;

async function getMaxOrderModifiedAt() {
  const r = await prisma.order.aggregate({ _max: { modifiedAt: true } });
  return r._max.modifiedAt;
}

export async function syncRemonlineOrders() {
  devLog({ time: new Date(), message: 'syncRemonlineOrders — start' });

  const maxModifiedAt = await getMaxOrderModifiedAt();
  const nowMs = Date.now();
  const sort_dir = 'asc';

  let totalPages;
  let startPage = 1;

  while (true) {
    const targetPage = startPage + PAGES_PER_BATCH - 1;

    const { orders, count, lastPage } = await getOrders({
      modified_at: maxModifiedAt != null ? Number(maxModifiedAt) : undefined,
      modified_at_to: nowMs,
      sort_dir,
      startPage,
      targetPage,
    });

    if (totalPages == null && count != null) {
      totalPages = Math.ceil(count / PAGE_SIZE);
    }

    devLog({
      message: 'syncRemonlineOrders — batch fetched',
      startPage,
      targetPage,
      lastPage,
      fetched: orders?.length ?? 0,
      apiCount: count,
      totalPages,
    });

    if (!orders || orders.length === 0) break;

    const parsed = parseOrders(orders);
    const orderIds = parsed.ordersRows.map((o) => o.id);

    devLog({
      message: 'syncRemonlineOrders — batch parsed',
      startPage,
      lastPage,
      orders: parsed.ordersRows.length,
      parts: parsed.partsRows.length,
      operations: parsed.operationsRows.length,
      attachments: parsed.attachmentsRows.length,
      resources: parsed.resourcesRows.length,
      links: parsed.linksRows.length,
      skipped: parsed.skippedOrderIds.length,
      orderIds,
    });

    await prisma.$transaction(
      async (tx) => {
        // Prisma's relationMode = "prisma" does NOT cascade through deleteMany
        // (it only emulates cascade for single delete/update). Clean dependents
        // explicitly before removing the parent rows.
        await tx.orderPart.deleteMany({
          where: { orderId: { in: orderIds } },
        });
        await tx.orderOperation.deleteMany({
          where: { orderId: { in: orderIds } },
        });
        await tx.orderAttachment.deleteMany({
          where: { orderId: { in: orderIds } },
        });
        await tx.orderToResource.deleteMany({
          where: { orderId: { in: orderIds } },
        });
        await tx.order.deleteMany({ where: { id: { in: orderIds } } });

        await tx.order.createMany({ data: parsed.ordersRows });
        await tx.orderPart.createMany({ data: parsed.partsRows });
        await tx.orderOperation.createMany({ data: parsed.operationsRows });
        await tx.orderAttachment.createMany({ data: parsed.attachmentsRows });
        await tx.orderResource.createMany({
          data: parsed.resourcesRows,
          skipDuplicates: true,
        });
        await tx.orderToResource.createMany({
          data: parsed.linksRows,
          skipDuplicates: true,
        });
      },
      { maxWait: TX_MAX_WAIT_MS, timeout: TX_TIMEOUT_MS }
    );

    devLog({
      message: 'syncRemonlineOrders — batch persisted',
      startPage,
      lastPage,
      orders: parsed.ordersRows.length,
    });

    if (totalPages != null && lastPage >= totalPages) break;

    startPage = lastPage + 1;
  }

  devLog({ message: 'syncRemonlineOrders — done', totalPages });
}

const toBigInt = (v) => (v == null ? null : BigInt(v));

const dedupBy = (rows, keyFn, label) => {
  const seen = new Map();
  const out = [];
  const collisions = [];
  for (const r of rows) {
    const k = keyFn(r);
    if (seen.has(k)) {
      collisions.push({ key: k, first: seen.get(k), dup: r });
      continue;
    }
    seen.set(k, r);
    out.push(r);
  }
  if (collisions.length > 0) {
    console.warn({
      function: 'dedupBy',
      label,
      droppedCount: collisions.length,
      sample: collisions.slice(0, 5),
    });
  }
  return out;
};

function parseOrders(orders) {
  const ordersRows = [];
  const partsRows = [];
  const operationsRows = [];
  const attachmentsRows = [];
  const resourceMap = new Map();
  const linksRows = [];
  const skippedOrderIds = [];

  for (const order of orders) {
    try {
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
    } catch (e) {
      console.error({
        function: 'parseOrders',
        message: 'Failed to map order — skipping',
        orderId: order?.id,
        idLabel: order?.id_label,
        error: e?.message,
      });
      skippedOrderIds.push(order?.id);
    }
  }

  if (skippedOrderIds.length > 0) {
    console.warn({
      function: 'parseOrders',
      message: 'Some orders were skipped due to mapping errors',
      count: skippedOrderIds.length,
      ids: skippedOrderIds,
    });
  }

  return {
    ordersRows: dedupBy(ordersRows, (o) => o.id, 'orders'),
    partsRows: dedupBy(partsRows, (p) => `${p.orderId}:${p.id}`, 'parts'),
    operationsRows: dedupBy(
      operationsRows,
      (op) => `${op.orderId}:${op.id}`,
      'operations'
    ),
    attachmentsRows,
    resourcesRows: [...resourceMap.values()],
    linksRows: dedupBy(
      linksRows,
      (l) => `${l.resourceId}:${l.orderId}`,
      'links'
    ),
    skippedOrderIds,
  };
}

if (process.env.ENV === 'TEST') {
  devLog('Running syncRemonlineOrders in TEST mode...');
  await remonlineTokenToEnv(true);
  await syncRemonlineOrders();
}
