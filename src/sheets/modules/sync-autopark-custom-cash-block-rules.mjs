import { getAllRowsAsObjects, readDCBRSheetColumnA } from '../sheets.utils.mjs';
import {
  createAutoParksExcludedFromDCBR,
  deactivateAutoParksExcludedFromDCBR,
  getAutoParksExcludedFromCashBlockRules,
} from '../../web.api/web.api.queries.mjs';
import { getSetDifferences, isUuid } from '../../shared/shared.utils.mjs';

export const synchronizeAutoParkCustomCashBlockRules = async () => {
  // const autoParkRules = await getAutoParksExcludedFromCashBlockRules();
  const autoParkRulesFromSheet = await getAllRowsAsObjects();

  console.log(autoParkRulesFromSheet)
  return;
  const excludedAutoParkIds = autoParkRules.map(
    ({ auto_park_id }) => auto_park_id
  );
  const verifiedAutoParksFromSheet = autoParkRulesFromSheet.filter(isUuid);

  const excludedAutoParkIdsSet = new Set(excludedAutoParkIds);
  const verifiedAutoParksFromSheetSet = new Set(verifiedAutoParksFromSheet);

  const [newAutoParks, deletedAutoParks] = getSetDifferences(
    excludedAutoParkIdsSet,
    verifiedAutoParksFromSheetSet
  );
  console.log({
    message: 'synchronizeAutoParksExcludedFromDCBRSetting',
    date: new Date(),
    newAutoParks: newAutoParks.size,
    deletedAutoParks: deletedAutoParks.size,
  });

  await deactivateAutoParksExcludedFromDCBR([...deletedAutoParks]);
  await createAutoParksExcludedFromDCBR([...newAutoParks]);
};

if (process.env.ENV == 'TEST') {
  synchronizeAutoParkCustomCashBlockRules();
}
