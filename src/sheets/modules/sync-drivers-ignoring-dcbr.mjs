import { readDCBRSheetColumnA } from '../sheets.utils.mjs';
import {
  createDriversIgnoringDCBR,
  deactivateDriversIgnoringDCBR,
  getDriversIgnoringCashBlockRules,
} from '../../web.api/web.api.queries.mjs';

function isUuid(str) {
  if (typeof str !== 'string' || str.length === 0) {
    return false;
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(str);
}

/**
 * Calculates the difference between two sets, returning the unique elements from each.
 *
 * This function computes two new sets:
 * 1. Elements that exist in the first set but not in the second.
 * 2. Elements that exist in the second set but not in the first.
 *
 * @param {Set} setA The first set.
 * @param {Set} setB The second set.
 * @returns {[Set, Set]} An array containing two sets: [differenceA, differenceB].
 */
function getSetDifferences(setA, setB) {
  const differenceA = new Set();
  const differenceB = new Set();

  for (const elem of setA) {
    if (!setB.has(elem)) {
      differenceA.add(elem);
    }
  }

  for (const elem of setB) {
    if (!setA.has(elem)) {
      differenceB.add(elem);
    }
  }

  return [differenceB, differenceA];
}

export const synchronizeDriversIgnoringDCBR = async () => {
  const driversToIgnore = new Set(
    (await getDriversIgnoringCashBlockRules()).map(({ driver_id }) => driver_id)
  );
  const driversFromSheet = new Set(
    (await readDCBRSheetColumnA('drivers')).filter(isUuid)
  );
  const [newDrivers, deletedDrivers] = getSetDifferences(
    driversToIgnore,
    driversFromSheet
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
