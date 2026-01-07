// src/prisma.mjs

// 1. Import the specific classes from the generated folders
import { PrismaClient as RemOnlineClient } from './generated/remonline/index.js';
import { PrismaClient as BitrixClient } from './generated/bitrix/index.js';


const INTERNAL_PG_USER=process.env.INTERNAL_PG_USER
const INTERNAL_PG_PASSWORD=process.env.INTERNAL_PG_PASSWORD
const INTERNAL_PG_HOST=process.env.INTERNAL_PG_HOST
const INTERNAL_PG_PORT=process.env.INTERNAL_PG_PORT

// 2. Helper to build connection strings (reusing your existing logic if needed)
const getUrl = (dbName) => {
  let url = `postgresql://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PG_HOST}:${process.env.PG_PORT}/${dbName}`;
  if (process.env.ENV === 'TEST' || process.env.ENV === 'DEV') {
    url = `postgresql://${process.env.PG_USER}:${encodeURIComponent(process.env.PG_PASSWORD)}@${process.env.PG_HOST}:${process.env.PG_PORT}/${dbName}`;
  }
  return url;
};

// 3. Export specific instances
// We pass the URL explicitly to override whatever is in the schema file
export const remonlineDb = new RemOnlineClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_REMONLINE || getUrl('remonline_db'),
    },
  },
});

export const bitrixDb = new BitrixClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_BITRIX || getUrl('bitrix_db'),
    },
  },
});
