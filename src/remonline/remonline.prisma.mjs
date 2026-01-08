import { PrismaClient as RemOnlineClient } from '@prisma/client-remonline';
import { generatePostgresConnectionString } from '../prisma/prisma.mjs';
export const remonlineDb = new RemOnlineClient({
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
