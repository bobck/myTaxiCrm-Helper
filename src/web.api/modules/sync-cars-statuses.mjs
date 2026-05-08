import fs from 'fs';
import { pool } from '../../api/pool.mjs';
import mytaxiPrisma from '../../mytaxi/mytaxi.prisma.mjs';

async function getCarsCurrentStatuses() {
  const sql = fs.readFileSync('./src/sql/cars-current-statuses.sql').toString();
  const { rows } = await pool.query(sql);
  return rows;
}

export async function syncCarsStatuses() {
  console.log({ time: new Date(), message: 'syncCarsStatuses start' });

  const rows = await getCarsCurrentStatuses();

  console.log({ carsWithSchedule: rows.length });

  if (rows.length === 0) {
    return;
  }

  const existing = await mytaxiPrisma.car.findMany({
    select: { id: true, status: true },
  });
  const existingById = new Map(existing.map((car) => [car.id, car.status]));

  const toUpsert = [];
  const logEntries = [];

  for (const row of rows) {
    const { id, status, license_plate: licensePlate } = row;
    const prevStatus = existingById.get(id);

    if (prevStatus === status) {
      continue;
    }

    toUpsert.push({ id, status, licensePlate });
    logEntries.push({
      carId: id,
      prevStatus: prevStatus ?? null,
      nextStatus: status,
    });
  }

  console.log({ changedOrNew: toUpsert.length });

  if (toUpsert.length === 0) {
    return;
  }

  await mytaxiPrisma.$transaction([
    ...toUpsert.map((car) =>
      mytaxiPrisma.car.upsert({
        where: { id: car.id },
        create: car,
        update: { status: car.status, licensePlate: car.licensePlate },
      })
    ),
    mytaxiPrisma.carStatusLog.createMany({ data: logEntries }),
  ]);

  console.log({ time: new Date(), message: 'syncCarsStatuses done' });
}

if (process.env.ENV == 'TEST') {
  syncCarsStatuses()
    .catch((error) => console.error({ error }))
    .finally(() => mytaxiPrisma.$disconnect());
}
