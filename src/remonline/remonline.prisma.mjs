import { PrismaClient as RemOnlineClient } from '@prisma/client-remonline';
import { generatePostgresConnectionString } from '../prisma/prisma.mjs';
const remonlineDb = new RemOnlineClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL_REMONLINE ||
        generatePostgresConnectionString('remonline'),
    },
  },
});
export const upsertCashbox = async ({
  id,
  title,
  type,
  balance,
  is_global,
  currency,
}) => {
  return remonlineDb.cashbox.upsert({
    where: { id },
    update: {
      title,
      type,
      balance,
      isGlobal: is_global,
      currency: currency?.code || null,
    },
    create: {
      id,
      title,
      type,
      balance,
      isGlobal: is_global,
      currency: currency?.code || null,
    },
  });
};
export const upsertCashboxes = async (cashboxes) => {
  const promises = cashboxes.map((cashbox) => upsertCashbox(cashbox));
  return await remonlineDb.$transaction(promises);
};
export const getAllCashboxes = () => {
  return remonlineDb.cashbox.findMany();
};

export const upsertCashFlowItems = async (items) => {
  const promises = items.map((item) =>
    remonlineDb.cashFlowItem.upsert({
      where: { id: item.id },
      update: { name: item.name, direction: item.direction },
      create: { id: item.id, name: item.name, direction: item.direction },
    })
  );
  return Promise.all(promises);
};

export const createCashboxTransactions = async (transactions) => {
  if (transactions.length === 0) return;

  return remonlineDb.cashboxTransaction.createMany({
    data: transactions,
    skipDuplicates: true,
  });
};

export const getLastTransactionCreatedAt = async (cashboxId) => {
  const lastTx = await remonlineDb.cashboxTransaction.findFirst({
    where: { cashboxId }, // Updated field name
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  return lastTx?.createdAt || null;
};
