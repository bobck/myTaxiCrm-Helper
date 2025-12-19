import { auth, sheets } from '@googleapis/sheets';
import { devLog } from '../shared/shared.utils.mjs';

const KEY_FILE_PATH = './token.json';
const SPREADSHEET_ID = process.env.DCBR_SHEET_ID;
const ROBOTA_UA_COLD_SOURCING_SPREADSHEET_ID =
  process.env.ROBOTA_UA_COLD_SOURCING_SPREADSHEET_ID;
const ROBOTA_UA_CONFIG_SHEET_NAME = process.env.ROBOTA_UA_CONFIG_SHEET_NAME;

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
export async function getAllCustomRuledAutoParksFromSpreadSheet() {
  try {
    const sheetName = 'autopark_custom_rules';
    const response = await client.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetName,
    });

    const rows = response.data.values;

    if (!rows || rows.length <= 1) {
      return [];
    }

    const dataObjects = rows.slice(1).map((row) => {
      const [
        auto_park_id,
        mode,
        target,
        balanceActivationValue,
        depositActivationValue,
        maxDebt,
      ] = row;

      const balanceActivationValueNullVerified =
        balanceActivationValue === '' ? null : Number(balanceActivationValue);
      const balanceActivationValueIsNaNVerified = isNaN(
        balanceActivationValueNullVerified
      )
        ? null
        : balanceActivationValueNullVerified;

      const depositActivationValueNullVerified =
        depositActivationValue === '' ? null : Number(depositActivationValue);
      const depositActivationValueIsNaNVerified = isNaN(
        depositActivationValueNullVerified
      )
        ? null
        : depositActivationValueNullVerified;

      const maxDebtNullVerified = maxDebt === '' ? null : Number(maxDebt);
      const maxDebtIsNaNVerified = isNaN(maxDebtNullVerified)
        ? null
        : maxDebtNullVerified;
      const rowObject = {
        auto_park_id,
        mode,
        target,
        balanceActivationValue: balanceActivationValueIsNaNVerified,
        depositActivationValue: depositActivationValueIsNaNVerified,
        maxDebt: maxDebtIsNaNVerified,
      };
      return rowObject;
    });

    devLog(`Successfully parsed ${dataObjects.length} rows from ${sheetName}.`);
    return dataObjects;
  } catch (err) {
    console.error(`The API returned an error for sheet ${sheetName}:`, err);
    return null;
  }
}
export const fetchSearchConfiguration = async () => {
  const googleSheets = client;

  try {
    const response = await googleSheets.spreadsheets.values.get({
      spreadsheetId: ROBOTA_UA_COLD_SOURCING_SPREADSHEET_ID,
      range: `${ROBOTA_UA_CONFIG_SHEET_NAME}!A2:C`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      devLog('No configuration found in Google Sheets.');
      return [];
    }

    // Filter and Map
    return rows
      .filter((row) => {
        // Check if columns 0 (Keyword), 1 (Limit), and 2 (City) exist and are not whitespace
        const hasKeyword = row[0] && row[0].trim().length > 0;
        const hasLimit = row[1] && row[1].trim().length > 0;
        const hasCity = row[2] && row[2].trim().length > 0;

        if (!hasKeyword || !hasLimit || !hasCity) {
          // Optional: Log skipped rows for debugging
          devLog(`Skipping incomplete row: [${row.join(', ')}]`);
          return false;
        }
        return true;
      })
      .map((row) => ({
        keyword: row[0].trim(),
        limit: parseInt(row[1].trim(), 10), // We now know row[1] exists
        cityName: row[2].trim(), // We now know row[2] exists
      }));
  } catch (error) {
    console.error('Error fetching search configuration:', error);
    throw error;
  }
};
