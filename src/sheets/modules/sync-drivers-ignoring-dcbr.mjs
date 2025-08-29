import { readDCBRSheetColumnA } from '../sheets.utils.mjs';
import {
  createDriversIgnoringDCBR,
  deactivateDriversIgnoringDCBR,
  getDriversIgnoringCashBlockRules,
} from '../../web.api/web.api.queries.mjs';
import { getSetDifferences, isUuid } from '../../shared/shared.utils.mjs';


export const synchronizeDriversIgnoringDCBR = async () => {
  const driversToIgnore = await getDriversIgnoringCashBlockRules();
  const driversFromSheet = await readDCBRSheetColumnA('drivers');

  const driversToIgnoreIds = driversToIgnore.map(({ driver_id }) => driver_id);
  const verifiedDriversFromSheet = driversFromSheet.filter(isUuid);

  const driverToIgnoreIdSet = new Set(driversToIgnoreIds);
  const verifiedDriversFromSheetSet = new Set(verifiedDriversFromSheet);

  const [newDrivers, deletedDrivers] = getSetDifferences(
    driverToIgnoreIdSet,
    verifiedDriversFromSheetSet
  );
  console.log({
    message: 'synchronizeDriversIgnoringDCBR',
    date: new Date(),
    newDrivers: newDrivers.size,
    deletedDrivers: deletedDrivers.size,
  });

  await deactivateDriversIgnoringDCBR([...deletedDrivers]);
  await createDriversIgnoringDCBR([...newDrivers]);
};

if (process.env.ENV == 'TEST') {
  synchronizeDriversIgnoringDCBR();
}
