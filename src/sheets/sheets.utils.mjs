import { auth, sheets } from '@googleapis/sheets';

const KEY_FILE_PATH = './token.json';
const DCBR_SPREADSHEET_ID = process.env.DCBR_SHEET_ID;
const TARIFF_SPREADSHEET_ID = process.env.TARIFF_SHEET_ID;


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
      spreadsheetId: DCBR_SPREADSHEET_ID,
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


export async function getAutoParksToSetTariffRules() {
  try {
    const sheetName = 'trackedCities';
    const response = await client.spreadsheets.values.get({
      spreadsheetId: TARIFF_SPREADSHEET_ID,
      range: sheetName,
    });

    const rows = response.data.values;

    if (!rows || rows.length <= 1) {
      console.log(`No data found in sheet: ${sheetName}.`);
      return [];
    }

    const dataObjects = rows.slice(1).map((row) => {
      const [
        auto_park_sheet_name,
        auto_park_id
      ] = row;

      const rowObject = {
        auto_park_id,
        auto_park_sheet_name
      };
      return rowObject;
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

export async function getNewDriverTariffRulesByAutoParkSheetName(autoParkSheetName) {
  try {
    const response = await client.spreadsheets.values.get({
      spreadsheetId: TARIFF_SPREADSHEET_ID,
      range: `${autoParkSheetName}!A4:F`,
    });

    const rows = response.data.values;

    if (!rows || rows.length <= 1) {
      console.log(`No data found in sheet: ${sheetName}.`);
      return [];
    }

    const dataObjects = rows.slice(1).map((row) => {
      const [
        percentage,
        monday,
        tuesday,
        wednesday,
        thursday,
        friday,
        
      ] = row;

      const rowObject = {
        percentage,
        monday,
        tuesday,
        wednesday,
        thursday,
        friday,
      };
      return rowObject;
    });

    console.log(
      `Successfully parsed ${dataObjects.length} rows from ${autoParkSheetName}.`
    );
    return dataObjects;
  } catch (err) {
    console.error(`The API returned an error for sheet ${autoParkSheetName}:`, err);
    return [];
  }
}