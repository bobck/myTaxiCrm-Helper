import { PrismaClient as RemOnlineClient } from '@prisma/client-remonline';
import { generatePostgresConnectionString } from '../prisma/prisma.mjs';
export const remonlineDb = new RemOnlineClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_REMONLINE || generatePostgresConnectionString('remonline'),
    },
  },
});
export class RemonlineClinet{
    constructor() {
        this.prisma=
    }
}