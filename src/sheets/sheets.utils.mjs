import { auth, sheets } from '@googleapis/sheets';

const KEY_FILE_PATH = './hb-token.json';
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
  // The range 'A2:A' specifies:
  // - Start at cell A2 (to skip the header in A1)
  // - End at the last row of column A
  const range = `${sheetName}!A2:A`;
  console.log(`Reading range: ${range}`);

  try {
    const response = await client.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });

    const values = response.data.values;

    if (values && values.length > 0) {
      // The API returns a 2D array like [['value1'], ['value2']].
      // We use .map() to flatten it into a simple array: ['value1', 'value2'].
      const columnData = values.map((row) => row[0]);
      console.log(
        `Successfully parsed ${columnData.length} rows from column A.`
      );
      return columnData;
    } else {
      console.log(`No data found in column A of sheet: ${sheetName}.`);
      return [];
    }
  } catch (err) {
    console.error(`The API returned an error for range ${range}:`, err);
    return []; // Return an empty array on error
  }
}