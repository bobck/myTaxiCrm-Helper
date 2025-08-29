import { auth, sheets } from '@googleapis/sheets';

const KEY_FILE_PATH = './token.json';
const SPREADSHEET_ID = process.env.DCBR_SHEET_ID;

// Reusable authentication and client setup
const googleAuth = new auth.GoogleAuth({
  keyFilename: KEY_FILE_PATH,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const client = sheets({
  version: 'v4',
  auth: googleAuth,
});

/**
 * Reads a single column (A) from a sheet, skipping the header row,
 * and returns a simple array of its values.
 * @param {string} sheetName The name of the sheet (e.g., 'autoparks').
 * @returns {Promise<Array<string>>} A promise that resolves to an array of strings.
 */
export async function readDCBRSheetColumnA(sheetName) {
  const range = `${sheetName}!A2:A`;

  try {
    const response = await client.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });

    const values = response.data.values;

    if (values && values.length > 0) {
      const columnData = values.map((row) => row[0]);
      return columnData;
    } else {
      return [];
    }
  } catch (err) {
    console.error(`The API returned an error for range ${range}:`, err);
    return []; // Return an empty array on error
  }
}
export async function getAllRowsAsObjects() {
  try {
    const sheetName = 'autopark_custom_rules';
    const response = await client.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetName, // Reading the whole sheet
    });

    const rows = response.data.values;

    if (!rows || rows.length <= 1) {
      console.log(`No data found in sheet: ${sheetName}.`);
      return [];
    }

    // Use the first row as the headers (keys for our objects)
    const headers = rows[0];

    // Slice the array to remove the header row, then map over the remaining rows
    const dataObjects = rows.slice(1).map((row) => {
      const [
        auto_park_id,
        mode,
        target,
        balanceActivationValue,
        depositActivationValue,
        maxDebt,
      ] = row;
      const rowObject = {
        auto_park_id,
        mode,
        target,
        balanceActivationValue: Number(balanceActivationValue) || null,
        depositActivationValue: Number(depositActivationValue) || null,
        maxDebt: Number(maxDebt),
      };
      return rowObject;
    }).filter((ap) => {
      const {
        auto_park_id,
        mode,
        target,
        balanceActivationValue,
        depositActivationValue,
        maxDebt,
      } = ap;
      if (!auto_park_id || !mode || !target || !maxDebt) {
        return false;
      }

      if (
        (target == 'BOTH' || target == 'BALANCE') &&
        !balanceActivationValue
      ) {
        return false;
      }
      if (
        (target == 'BOTH' || target == 'DEPOSIT') &&
        !depositActivationValue
      ) {
        return false;
      }
      return true;
    });

    console.log(
      `Successfully parsed ${dataObjects.length} rows from ${sheetName}.`
    );
    return dataObjects;
  } catch (err) {
    console.error(`The API returned an error for sheet ${sheetName}:`, err);
    return [];
  }
}