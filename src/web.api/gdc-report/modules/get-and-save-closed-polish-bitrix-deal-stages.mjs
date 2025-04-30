import { DateTime } from 'luxon';
import {
  getDealsIdsByStageEnteredDate,
  getDealsByIdsVerifyingStageConstancy,
} from '../../../bitrix/bitrix.utils.mjs';

export async function getAndSaveClosedPolishBitrixDealStages(manualDate) {
  const date =
    manualDate ||
    DateTime.now()
      .setZone('Europe/Kyiv')
      .minus({ days: 1 })
      .toFormat('yyyy-MM-dd');
  console.log({
    time: new Date(),
    date,
    message: 'getAndSaveClosedPolishBitrixDealStages',
  });
  const category_id = '40';
  const stage_ids = ['C40:WON', 'C40:UC_TFNPUX'];
  const deals = [];
  for (const stage_id of stage_ids) {
    const { matchingDealIds } = await getDealsIdsByStageEnteredDate({
      date,
      category_id,
      stage_id,
    });
    console.log(matchingDealIds);
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
  console.log(jsonData);
}
if (process.env.ENV === 'TEST') {
  await getAndSaveClosedPolishBitrixDealStages();
}
