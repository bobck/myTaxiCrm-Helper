import { getOrderStatuses } from '../remonline.utils.mjs';
import prisma from '../remonline.prisma.mjs';
import { devLog } from '../../shared/shared.utils.mjs';
import { remonlineTokenToEnv } from '../remonline.api.mjs';

function mapStatusToPgRow(status) {
  const group = status.group || {};
  return {
    id: status.id,
    name: status.name,
    color: status.color ?? null,
    groupType: group.type ?? null,
    groupName: group.name ?? null,
  };
}

export async function syncOrderStatuses() {
  console.log({ time: new Date(), message: 'syncOrderStatuses start' });

  const statuses = await getOrderStatuses();
  const rows = statuses.map(mapStatusToPgRow);
  const ids = rows.map((row) => row.id);

  await prisma.$transaction([
    prisma.orderStatus.deleteMany({ where: { id: { in: ids } } }),
    prisma.orderStatus.createMany({ data: rows }),
  ]);

  console.log({ message: 'syncOrderStatuses done', total: rows.length });
}

if (process.env.ENV === 'TEST') {
  devLog('Running syncOrderStatuses in TEST mode...');
  await remonlineTokenToEnv(true);
  await syncOrderStatuses();
}
