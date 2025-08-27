import { readDCBRSheetColumnA } from '../../sheets/sheets.utils.mjs';
import {
  createDriversIgnoringDCBR,
  deactivateDriversIgnoringDCBR,
  getDriversIgnoringCashBlockRules,
} from '../web.api.queries.mjs';

function isUuid(str) {
  // First, check if the input is a string and not empty.
  if (typeof str !== 'string' || str.length === 0) {
    return false;
  }

  // Regular expression to check the UUID format, including version and variant.
  // - ^[0-9a-f]{8}-      : Matches 8 hex characters followed by a hyphen.
  // - [0-9a-f]{4}-      : Matches 4 hex characters followed by a hyphen.
  // - [1-5][0-9a-f]{3}-  : Matches the version (1-5) and 3 more hex characters, followed by a hyphen.
  // - [89ab][0-9a-f]{3}- : Matches the variant (8, 9, A, or B) and 3 more hex characters, followed by a hyphen.
  // - [0-9a-f]{12}$      : Matches the final 12 hex characters.
  // - i                  : Case-insensitive flag.
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  // Test the string against the regular expression.
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

  // Find elements in setA that are not in setB
  for (const elem of setA) {
    if (!setB.has(elem)) {
      differenceA.add(elem);
    }
  }

  // Find elements in setB that are not in setA
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
  console.log({
    newDrivers,
    deletedDrivers,
  });

  await deactivateDriversIgnoringDCBR([...deletedDrivers]);
  await createDriversIgnoringDCBR([...newDrivers]);
};

if (process.env.ENV == 'TEST') {
  synchronizeDriversIgnoringDCBR();
}
