import { DateTime } from 'luxon';
import {
  getDealsIdsByStageEnteredDate,
  getDealsByIdsVerifyingStageConstancy,
} from '../../../bitrix/bitrix.utils.mjs';

import {
  clearTableByDate,
  loadRowsViaJSONFile,
  createOrResetTableByName,
} from '../../../bq/bq-utils.mjs';
import { closedPolishBitrixDealsTableSchema } from '../../../bq/schemas.mjs';

const table_id = 'closed_polish_bitrix_deals';
const dataset_id = 'DB';
const dealEntityTypeId = 2; // 2 - deal entity type id
export async function getAndSaveClosedPolishBitrixDeals(manualDate) {
  const date =
    manualDate ||
    DateTime.now()
      .minus({ days: 1 })
      .setZone('Europe/Kyiv')
      .toFormat('yyyy-MM-dd');
  console.log({
    time: new Date(),
    date,
    message: 'getAndSaveClosedPolishBitrixDealStages',
  });
  const category_id = '40';
  const new_driver_stage = 'C40:WON'; // Прийняв авто
  const fired_stage = 'C40:UC_TFNPUX'; // Звільнився
  const stage_ids = [new_driver_stage, fired_stage];
  const deals = [];

  // --- Date Processing ---
  let targetDate;
  try {
    targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) throw new Error('Invalid date format');
  } catch (e) {
    console.error(`Error processing date: ${e.message}`);
    return null;
  }
  targetDate.setUTCHours(0, 0, 0, 0);
  const startDateISO = targetDate.toISOString();
  const endDate = new Date(targetDate);
  endDate.setUTCDate(targetDate.getUTCDate() + 1);
  const endDateISO = endDate.toISOString();

  for (const stage_id of stage_ids) {
    const matchingDealIds = new Set();
    const { historyRecords } = await getDealsIdsByStageEnteredDate({
      startDateISO,
      endDateISO,
      category_id,
      stage_id,
      dealEntityTypeId,
    });

    historyRecords.forEach((record) => matchingDealIds.add(record.OWNER_ID));

    if (matchingDealIds.size === 0) {
      continue;
    }
    const dealsByIds = await getDealsByIdsVerifyingStageConstancy({
      matchingDealIds,
      category_id,
      stage_id,
    });
    if (dealsByIds.length === 0) {
      continue;
    }
    deals.push(...dealsByIds);
  }

  const jsonData = deals.map((deal) => {
    const { ID, SOURCE_ID, STAGE_ID, UF_CRM_1527615815, UF_CRM_1722203030883 } =
      deal;
    return {
      id: ID,
      source_id: SOURCE_ID,
      city_id: UF_CRM_1527615815,
      stage_id: STAGE_ID,
      is_rescheduled: UF_CRM_1722203030883 == '1',
      date,
    };
  });
  await clearTableByDate({ bqTableId: table_id, date });
  await loadRowsViaJSONFile({
    table_id,
    dataset_id,
    rows: jsonData,
    schema: closedPolishBitrixDealsTableSchema,
  });
}
if (process.env.ENV === 'TEST') {
  await getAndSaveClosedPolishBitrixDeals();
  // await createOrResetTableByName({
  //   bqTableId:table_id,
  //   datasetId: dataset_id,
  //   schema: closedPolishBitrixDealsTableSchema,
  // });
}
