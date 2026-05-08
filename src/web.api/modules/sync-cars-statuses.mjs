import fs from 'fs';
import { CarEventType } from '@prisma/client-mytaxi';
import { pool } from '../../api/pool.mjs';
import mytaxiPrisma from '../mytaxi.prisma.mjs';

const EVENT_TYPES = Object.values(CarEventType);

async function getCarsCurrentStatuses() {
  const sql = fs.readFileSync('./src/sql/cars-current-statuses.sql').toString();
  const { rows } = await pool.query(sql);
  return rows;
}

// !!! TEMP TEST STUB — REMOVE BEFORE PROD !!!
// Перетирает статус каждой 5-й машины случайным значением, чтобы провоцировать
// изменения и проверять, что diff/логирование/уведомления работают.
// Вызывается ниже только при ENV === 'TEST'. Удалить эту функцию и её вызов
// одновременно, когда заглушка перестанет быть нужна.
function mutateEveryFifthRowStatus(rows) {
  let mutated = 0;
  for (let i = 0; i < rows.length; i++) {
    if ((i + 1) % 5 !== 0) continue;
    rows[i].status =
      EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
    mutated++;
  }
  console.log({ testMode: 'mutateEveryFifthRowStatus', mutated });
}

export async function syncCarsStatuses() {
  console.log({ time: new Date(), message: 'syncCarsStatuses start' });

  const rows = await getCarsCurrentStatuses();

  console.log({ carsWithSchedule: rows.length });

  if (rows.length === 0) {
    return;
  }

  // !!! TEMP TEST STUB — REMOVE BEFORE PROD (см. mutateEveryFifthRowStatus выше) !!!
  if (process.env.ENV === 'TEST') {
    mutateEveryFifthRowStatus(rows);
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
      logEntries.push({
        carId: id,
        prevStatus,
        nextStatus: status,
      });
    } else {
      newCars.push({ id, status, licensePlate });
    }
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
  if (logEntries.length > 0) {
    ops.push(mytaxiPrisma.carStatusLog.createMany({ data: logEntries }));
  }

  await mytaxiPrisma.$transaction(ops);

  console.log({ time: new Date(), message: 'syncCarsStatuses done' });
}

if (process.env.ENV == 'TEST') {
  syncCarsStatuses()
    .catch((error) => console.error({ error }))
    .finally(() => mytaxiPrisma.$disconnect());
}
