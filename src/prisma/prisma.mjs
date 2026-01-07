import { PrismaClient as RemOnlineClient } from '@prisma/client-remonline';
import { PrismaClient as BitrixClient } from '@prisma/client-bitrix';

const INTERNAL_PG_USER = process.env.INTERNAL_PG_USER;
const INTERNAL_PG_PASSWORD = process.env.INTERNAL_PG_PASSWORD;
const INTERNAL_PG_HOST = process.env.INTERNAL_PG_HOST;
const INTERNAL_PG_PORT = process.env.INTERNAL_PG_PORT;

// 2. Helper to build connection strings (reusing your existing logic if needed)
const getUrl = (dbName) => {
  return `postgresql://${INTERNAL_PG_USER}:${encodeURIComponent(INTERNAL_PG_PASSWORD)}@${INTERNAL_PG_HOST}:${INTERNAL_PG_PORT}/${dbName}`;
};

// 3. Export specific instances
// We pass the URL explicitly to override whatever is in the schema file
export const remonlineDb = new RemOnlineClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_REMONLINE || getUrl('remonline'),
    },
  },
});

export const bitrixDb = new BitrixClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_BITRIX || getUrl('bitrix'),
    },
  },
});

console.log(remonlineDb.tr);
