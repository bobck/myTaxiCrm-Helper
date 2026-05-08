import fs from 'fs';
import { pool } from '../../api/pool.mjs';
import mytaxiPrisma from '../mytaxi.prisma.mjs';

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

  const newCars = [];
  const changedCars = [];
  const logEntries = [];

  for (const row of rows) {
    const { id, status, license_plate: licensePlate } = row;
    const isExisting = existingById.has(id);
    const prevStatus = existingById.get(id);

    if (isExisting && prevStatus === status) {
      continue;
    }

    if (isExisting) {
      changedCars.push({ id, status, licensePlate });
    } else {
      newCars.push({ id, status, licensePlate });
    }

    logEntries.push({
      carId: id,
      prevStatus: prevStatus ?? null,
      nextStatus: status,
    });
  }

  console.log({ new: newCars.length, changed: changedCars.length });

  if (newCars.length === 0 && changedCars.length === 0) {
    return;
  }

  const ops = [];
  if (newCars.length > 0) {
    ops.push(mytaxiPrisma.car.createMany({ data: newCars }));
  }
  for (const car of changedCars) {
    ops.push(
      mytaxiPrisma.car.update({
        where: { id: car.id },
        data: { status: car.status, licensePlate: car.licensePlate },
      })
    );
  }
  ops.push(mytaxiPrisma.carStatusLog.createMany({ data: logEntries }));

  await mytaxiPrisma.$transaction(ops);

  console.log({ time: new Date(), message: 'syncCarsStatuses done' });
}

if (process.env.ENV == 'TEST') {
  syncCarsStatuses()
    .catch((error) => console.error({ error }))
    .finally(() => mytaxiPrisma.$disconnect());
}
