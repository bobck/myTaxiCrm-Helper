import fs from 'fs';
import { pool } from '../../api/pool.mjs';
import mytaxiPrisma from '../mytaxi.prisma.mjs';

async function getAutoParks() {
  const sql = fs.readFileSync('./src/sql/auto-parks.sql').toString();
  const { rows } = await pool.query(sql);
  return rows;
}

export async function syncAutoParks() {
  console.log({ time: new Date(), message: 'syncAutoParks start' });

  const rows = await getAutoParks();

  console.log({ autoParks: rows.length });

  if (rows.length === 0) {
    return;
  }

  const ops = rows.map((row) => {
    const data = {
      companyId: row.company_id,
      name: row.name,
      timezone: row.timezone,
      currencyId: row.currency_id,
      countryCode: row.country_code,
      code: row.code,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    return mytaxiPrisma.autoPark.upsert({
      where: { id: row.id },
      create: { id: row.id, ...data },
      update: data,
    });
  });

  await mytaxiPrisma.$transaction(ops);

  console.log({ time: new Date(), message: 'syncAutoParks done', count: ops.length });
}

if (process.env.ENV == 'TEST') {
  syncAutoParks()
    .catch((error) => console.error({ error }))
    .finally(() => mytaxiPrisma.$disconnect());
}
