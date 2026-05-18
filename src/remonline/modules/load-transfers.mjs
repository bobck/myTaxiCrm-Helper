import { getTransfers } from '../remonline.utils.mjs';
import prisma from '../remonline.prisma.mjs';
import { devLog, toFloat } from '../../shared/shared.utils.mjs';
import { remonlineTokenToEnv } from '../remonline.api.mjs';
import { getEntitySync } from '../remonline.queries.mjs';

const ENTITY_NAME = 'Transfer';

function mapTransferToPgRow(transfer) {
  return {
    id: transfer.id,
    branchId: transfer.branch_id,
    warehouseId: transfer.warehouse_id,
    createdAt: new Date(transfer.created_at),
    description: transfer.description ?? null,
    createdById: transfer.created_by_id,
    idLabel: transfer.id_label,
    cost: toFloat(transfer.cost) ?? 0,
    sourceWarehouseTitle: transfer.source_warehouse_title ?? '',
    targetWarehouseTitle: transfer.target_warehouse_title ?? '',
    createdByFullname: transfer.created_by_fullname ?? '',
  };
}

function mapProductToPgRow({ transfer, product }) {
  const uom = product.uom || {};
  return {
    branchId: transfer.branch_id,
    warehouseId: transfer.warehouse_id,
    transferId: transfer.id,
    id: product.id,
    title: product.title,
    isSerial: !!product.is_serial,
    code: product.code ?? null,
    article: product.article ?? null,
    amount: toFloat(product.amount) ?? 0,
    uomId: uom.id ?? null,
    uomTitle: uom.title ?? null,
    uomDescription: uom.description ?? null,
  };
}

export async function loadTransfers() {
  const time = new Date();
  devLog({ time, message: 'loadTransfers' });

  const sync = await getEntitySync(ENTITY_NAME);
  const createdAtFromMs = sync.last_created_at_ms
    ? sync.last_created_at_ms
    : undefined;

  const branches = await prisma.branch.findMany({
    select: { id: true },
  });
  devLog({
    message: 'loadTransfers: fetched branches from DB',
    branchCount: branches.length,
    createdAtFromMs,
  });

  const allTransfers = [];
  for (const branch of branches) {
    const { transfers } = await getTransfers({
      branchId: branch.id,
      createdAtFromMs,
    });
    allTransfers.push(...transfers);
  }

  if (allTransfers.length === 0) {
    devLog({ message: 'loadTransfers: nothing new, skipping' });
    return;
  }

  const transferRows = allTransfers.map(mapTransferToPgRow);
  const productRows = allTransfers.flatMap((t) =>
    (t.products || []).map((product) =>
      mapProductToPgRow({ transfer: t, product })
    )
  );
  const transferIds = [...new Set(transferRows.map((r) => r.id))];
  const maxCreatedAtMs = Math.max(
    ...allTransfers.map((transfer) => transfer.created_at)
  );
  const syncDetails = { last_created_at_ms: maxCreatedAtMs };

  await prisma.$transaction([
    prisma.transferProduct.deleteMany({
      where: { transferId: { in: transferIds } },
    }),
    prisma.transfer.deleteMany({ where: { id: { in: transferIds } } }),
    prisma.transfer.createMany({ data: transferRows }),
    prisma.transferProduct.createMany({
      data: productRows,
      skipDuplicates: true,
    }),
    prisma.entitySync.upsert({
      where: { entityName: ENTITY_NAME },
      create: { entityName: ENTITY_NAME, syncDetails },
      update: { syncDetails },
    }),
  ]);

  devLog({
    message: `loadTransfers synced ${transferRows.length} transfers, ${productRows.length} products.`,
    maxCreatedAtMs,
  });
}

if (process.env.ENV === 'TEST') {
  devLog({ message: 'Running loadTransfers in TEST mode...' });
  await remonlineTokenToEnv(true);
  await loadTransfers();
}
