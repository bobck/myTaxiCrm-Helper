import { getWarehouses, getWarehouseCells } from '../remonline.utils.mjs';
import prisma from '../remonline.prisma.mjs';
import { devLog } from '../../shared/shared.utils.mjs';
import { remonlineTokenToEnv } from '../remonline.api.mjs';

function mapWarehouseToPgRow(warehouse) {
  return {
    id: warehouse.id,
    title: warehouse.title ?? null,
    isGlobal: warehouse.is_global ?? null,
    type: warehouse.type ?? null,
  };
}

function mapCellToPgRow(cell, warehouseId) {
  return {
    id: cell.id,
    warehouseId,
    code: cell.code ?? null,
    isDefault: cell.is_default ?? null,
    title: cell.title ?? null,
  };
}

export async function syncWarehouses() {
  console.log({ time: new Date(), message: 'syncWarehouses start' });

  const warehouses = await getWarehouses();
  devLog({ function: 'syncWarehouses', warehouses: warehouses.length });

  const allCells = [];
  for (let i = 0; i < warehouses.length; i += 1) {
    const warehouse = warehouses[i];
    try {
      const cells = await getWarehouseCells(warehouse.id);
      for (const cell of cells) {
        allCells.push(mapCellToPgRow(cell, warehouse.id));
      }
    } catch (error) {
      console.error({
        function: 'syncWarehouses',
        warehouseId: warehouse.id,
        message: 'failed to fetch cells',
        error: error?.message,
      });
    }
    devLog({
      function: 'syncWarehouses',
      processed: i + 1,
      total: warehouses.length,
      cellsSoFar: allCells.length,
    });
  }

  const warehouseRows = warehouses.map(mapWarehouseToPgRow);

  await prisma.$transaction([
    prisma.warehouseCell.deleteMany({}),
    prisma.warehouse.deleteMany({}),
    prisma.warehouse.createMany({ data: warehouseRows }),
    prisma.warehouseCell.createMany({ data: allCells }),
  ]);

  console.log({
    message: 'syncWarehouses done',
    warehouses: warehouseRows.length,
    cells: allCells.length,
  });
}

if (process.env.ENV === 'TEST') {
  devLog('Running syncWarehouses in TEST mode...');
  await remonlineTokenToEnv(true);
  await syncWarehouses();
}
