import { getClients } from '../remonline.utils.mjs';
import prisma from '../remonline.prisma.mjs';
import { devLog, jsonOrNull, toFloat } from '../../shared/shared.utils.mjs';
import { getEntitySync } from '../remonline.queries.mjs';
import { remonlineTokenToEnv } from '../remonline.api.mjs';

const ENTITY_NAME = 'Client';
const BATCH_PAGES_LIMIT = 50;

function mapClientToPgRow(client) {
  const adCampaign = client.ad_campaign || {};
  const phones = Array.isArray(client.phone) ? client.phone : null;

  return {
    id: client.id,
    name: client.name ?? null,
    firstName: client.first_name ?? null,
    lastName: client.last_name ?? null,
    email: client.email ?? null,
    phone: phones && phones.length ? phones : null,
    notes: client.notes ?? null,
    address: client.address ?? null,
    supplier: client.supplier ?? null,
    juridical: client.juridical ?? null,
    conflicted: client.conflicted ?? null,
    modifiedAt: client.modified_at ?? null,
    createdAt: client.created_at ?? null,
    discountCode: client.discount_code ?? null,
    discountGoods: toFloat(client.discount_goods),
    orderDiscountServices: toFloat(client.order_discount_services),
    saleDiscountServices: toFloat(client.sale_discount_services),
    discountMaterials: toFloat(client.discount_materials),
    customFields: jsonOrNull(client.custom_fields),
    adCampaignId: adCampaign.id ?? null,
  };
}

async function saveClientsBatch(clients) {
  if (clients.length === 0) return 0;

  const rows = clients.map(mapClientToPgRow);
  const clientIds = rows.map((row) => row.id);

  const maxModifiedAt = rows.reduce((max, row) => {
    if (row.modifiedAt === null || row.modifiedAt === undefined) return max;
    if (max === null || row.modifiedAt > max) return row.modifiedAt;
    return max;
  }, null);

  const transactionOps = [
    prisma.client.deleteMany({ where: { id: { in: clientIds } } }),
    prisma.client.createMany({ data: rows }),
  ];
  if (maxModifiedAt !== null) {
    const syncDetails = { last_modified_at: Number(maxModifiedAt) };
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

export async function loadClients({ pageLimit } = {}) {
  console.log({ time: new Date(), message: 'loadClients start' });

  const sync = await getEntitySync(ENTITY_NAME);
  const modifiedAtFrom = sync.last_modified_at
    ? Number(sync.last_modified_at)
    : undefined;
  const modifiedAtTo = modifiedAtFrom ? Date.now() : undefined;

  let currentBatch = [];
  let currentBatchPages = 0;
  let totalSaved = 0;
  let lastPage = 0;

  try {
    for await (const { clients, page } of getClients({
      modifiedAtFrom,
      modifiedAtTo,
      pageLimit,
    })) {
      lastPage = page;
      if (clients.length > 0) currentBatch.push(...clients);
      currentBatchPages += 1;

      if (currentBatchPages >= BATCH_PAGES_LIMIT) {
        const batchToSave = currentBatch;
        currentBatch = [];
        currentBatchPages = 0;
        const saved = await saveClientsBatch(batchToSave);
        totalSaved += saved;
        devLog({
          message: `loadClients batch saved at page ${page}`,
          savedInBatch: saved,
          totalSaved,
        });
      }
    }

    if (currentBatch.length > 0) {
      const batchToSave = currentBatch;
      currentBatch = [];
      const saved = await saveClientsBatch(batchToSave);
      totalSaved += saved;
      devLog({
        message: `loadClients final batch saved at page ${lastPage}`,
        savedInBatch: saved,
        totalSaved,
      });
    }
  } catch (error) {
    console.error({
      message: 'loadClients failed',
      modifiedAtFrom,
      modifiedAtTo,
      lastPage,
      bufferedBatchSize: currentBatch.length,
      totalSavedBeforeFailure: totalSaved,
      error,
    });
  }

  console.log({
    message: 'loadClients done',
    modifiedAtFrom,
    modifiedAtTo,
    totalSaved,
    lastPage,
  });
}

if (process.env.ENV === 'TEST') {
  devLog('Running loadClients in TEST mode (pageLimit=2)...');
  await remonlineTokenToEnv(true);
  // await loadClients({ pageLimit: 2 });
  await loadClients();
}
