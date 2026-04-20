import { cityListWithAssignedBy } from '../bitrix.constants.mjs';
import { getInsuranceInvoices } from '../bitrix.utils.mjs';
import prisma from '../bitrix.prisma.mjs';
import {
  devLog,
  transliterateLicensePlate,
} from '../../shared/shared.utils.mjs';

const INSURANCE_INVOICE_BEGINNING_DATE = '2025-08-01';
const SYNC_ENTITY_NAME = 'insurance_invoices';

function transformInvoice(invoice) {
  const bitrixCity = cityListWithAssignedBy.find(
    (city) => city.cityId == invoice['UF_CRM_1527615815']
  );
  return {
    id: Number(invoice['ID']),
    paymentDate: invoice['UF_CRM_1642522045721']
      ? new Date(invoice['UF_CRM_1642522045721'].slice(0, 10))
      : null,
    createdAt: invoice['DATE_CREATE']
      ? new Date(invoice['DATE_CREATE'].slice(0, 10))
      : null,
    sum: Number(invoice['UF_CRM_1654075469']) || null,
    autoParkId: bitrixCity ? bitrixCity.auto_park_id : null,
    autoParkName: bitrixCity ? bitrixCity.cityName : null,
    licensePlate:
      transliterateLicensePlate(invoice['UF_CRM_1635249720750']) || null,
  };
}

async function getLastSyncTimestamp() {
  const meta = await prisma.syncMetadata.findUnique({
    where: { entityName: SYNC_ENTITY_NAME },
  });
  return meta?.lastSyncAt ?? null;
}

async function updateLastSyncTimestamp(timestamp) {
  await prisma.syncMetadata.upsert({
    where: { entityName: SYNC_ENTITY_NAME },
    create: { entityName: SYNC_ENTITY_NAME, lastSyncAt: timestamp },
    update: { lastSyncAt: timestamp },
  });
}

export async function syncInsuranceInvoices() {
  const logData = {
    message: 'syncInsuranceInvoices',
    date: new Date(),
  };

  const syncStartedAt = new Date();
  const lastSyncAt = await getLastSyncTimestamp();

  devLog({
    message: lastSyncAt
      ? `Incremental sync since ${lastSyncAt.toISOString()}`
      : 'Full sync (no previous sync found)',
  });

  let invoices;
  try {
    invoices = await getInsuranceInvoices({
      date: INSURANCE_INVOICE_BEGINNING_DATE,
      modifiedSince: lastSyncAt ? lastSyncAt.toISOString() : undefined,
    });
  } catch (error) {
    console.error({
      logData,
      error,
      summary: 'Failed invoice fetching from Bitrix',
    });
    return;
  }

  if (!invoices || invoices.length === 0) {
    devLog({ message: 'No invoices to sync' });
    await updateLastSyncTimestamp(syncStartedAt);
    console.log({ ...logData, syncedInvoices: 0 });
    return;
  }

  const processedInvoices = invoices.map(transformInvoice);
  devLog({ processedInvoices });

  try {
    await prisma.$transaction(
      processedInvoices.map(({ id, ...data }) =>
        prisma.insuranceInvoice.upsert({
          where: { id },
          create: { id, ...data },
          update: data,
        })
      )
    );

    await updateLastSyncTimestamp(syncStartedAt);
    logData.syncedInvoices = processedInvoices.length;
  } catch (error) {
    console.error({
      logData,
      error,
      summary: 'Failed invoice syncing to PostgreSQL',
    });
    return;
  }

  console.log(logData);
}

if (process.env.ENV === 'TEST') {
  await syncInsuranceInvoices();
}
