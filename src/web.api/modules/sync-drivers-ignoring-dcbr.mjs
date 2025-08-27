import { readDCBRSheetColumnA } from "../../sheets/sheets.utils.mjs";
import { getDriversIgnoringCashBlockRules } from "../web.api.queries.mjs";


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
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  // Test the string against the regular expression.
  return uuidRegex.test(str);
}

export const synchronizeDriversIgnoringDCBR = async () => {
  console.log({
    message: 'synchronizeDriversIgnoringDCBR',
    date: new Date()
  });
  const driversToIgnore = (await getDriversIgnoringCashBlockRules()).map(
    ({ driver_id }) => driver_id
  );
  const driversFromSheet = await readDCBRSheetColumnA('drivers');
  console.log({ driversFromSheet, driversToIgnore })
  for (const driver of driversToIgnore) {
    console.log({ driver, test: isUuid(`${driver} s`) })
  }
  const validUuidV4 = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
  const validUuidV1 = 'd9428888-122b-11e1-b85c-6170676f0000';
  const validUuidV5 = '886313e1-3b8a-5372-9b90-0c9aee199e5d';

  // Invalid UUIDs
  const invalidFormat = 'not-a-uuid-at-all';
  const wrongVersion = 'a1b2c3d4-e5f6-6a7b-8c9d-0e1f2a3b4c5d'; // Version 6 is invalid
  const wrongVariant = 'a1b2c3d4-e5f6-4a7b-7c9d-0e1f2a3b4c5d'; // Variant 7 is invalid
  const tooShort = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b';
  const notAString = 12345;

  console.log(`'${validUuidV4}' is a UUID:`, isUuid(validUuidV4)); // true
  console.log(`'${validUuidV1}' is a UUID:`, isUuid(validUuidV1)); // true
  console.log(`'${validUuidV5}' is a UUID:`, isUuid(validUuidV5)); // true

  console.log('---');

  console.log(`'${invalidFormat}' is a UUID:`, isUuid(invalidFormat)); // false
  console.log(`'${wrongVersion}' is a UUID:`, isUuid(wrongVersion)); // false
  console.log(`'${wrongVariant}' is a UUID:`, isUuid(wrongVariant)); // false
  console.log(`'${tooShort}' is a UUID:`, isUuid(tooShort));       // false
  console.log(`'${notAString}' is a UUID:`, isUuid(notAString));       // false

}


if (process.env.ENV == 'TEST') {
  synchronizeDriversIgnoringDCBR();
}

