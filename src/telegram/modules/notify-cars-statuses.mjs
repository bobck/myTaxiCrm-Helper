import fs from 'fs';
import { Telegram } from 'telegraf';
import { pool } from '../../api/pool.mjs';
import mytaxiPrisma from '../../web.api/mytaxi.prisma.mjs';

const PROBLEM_STATUSES = ['ON_SERVICE_STATION', 'ROAD_ACCIDENT', 'AUTO_POUND'];

async function getCarsInfo(carIds) {
  if (carIds.length === 0) return new Map();
  const sql = fs
    .readFileSync('./src/sql/cars-license-plate-and-city.sql')
    .toString();
  const { rows } = await pool.query(sql, [carIds]);
  return new Map(rows.map((r) => [r.id, r]));
}

export async function notifyCarsStatusChanges() {
  console.log({ time: new Date(), message: 'notifyCarsStatusChanges start' });

  const token = process.env.CAR_STATUS_BOT_TOKEN;
  const managerChatId = process.env.CAR_STATUS_MANAGER_CHAT_ID;
  if (!token || !managerChatId) {
    console.warn(
      'CAR_STATUS_BOT_TOKEN / CAR_STATUS_MANAGER_CHAT_ID not set, skip'
    );
    return;
  }

  const logs = await mytaxiPrisma.carStatusLog.findMany({
    where: {
      isManagerNotified: false,
      prevStatus: { in: PROBLEM_STATUSES },
      nextStatus: { notIn: PROBLEM_STATUSES },
    },
    orderBy: { changedAt: 'asc' },
  });

  console.log({ pendingNotifications: logs.length });

  if (logs.length === 0) {
    return;
  }

  const carIds = [...new Set(logs.map((l) => l.carId))];
  const carsById = await getCarsInfo(carIds);

  const bot = new Telegram(token);

  let sent = 0;
  for (const log of logs) {
    const car = carsById.get(log.carId);
    if (!car) {
      console.warn({ carId: log.carId, msg: 'no info from main DB, skip' });
      continue;
    }
    const text = `${car.license_plate} ${car.city} - Перешло в работу`;
    try {
      await bot.sendMessage(managerChatId, text);
      await mytaxiPrisma.carStatusLog.update({
        where: { id: log.id },
        data: { isManagerNotified: true },
      });
      sent++;
    } catch (error) {
      console.error({ logId: log.id.toString(), error });
    }
  }

  console.log({ time: new Date(), message: 'notifyCarsStatusChanges done', sent });
}

if (process.env.ENV == 'TEST') {
  notifyCarsStatusChanges()
    .catch((error) => console.error({ error }))
    .finally(() => mytaxiPrisma.$disconnect());
}
