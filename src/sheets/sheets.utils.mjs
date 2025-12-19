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
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
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
/**
 * Cold Sourcing: Reads search configuration from the specific config sheet.
 * Expected Columns: A=Keyword, B=Limit, C=City
 */
export const fetchColdSourcingConfig = async () => {
  try {
    const response = await client.spreadsheets.values.get({
      spreadsheetId: ROBOTA_UA_COLD_SOURCING_SPREADSHEET_ID,
      range: `${ROBOTA_UA_CONFIG_SHEET_NAME}!A2:C`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      devLog('No configuration found in Google Sheets.');
      return [];
    }

    return rows
      .filter((row) => {
        // Strict check: All 3 columns must be present and not empty
        return (
          row[0] &&
          row[0].trim() &&
          row[1] &&
          row[1].trim() &&
          row[2] &&
          row[2].trim()
        );
      })
      .map((row) => ({
        keyword: row[0].trim(),
        limit: parseInt(row[1].trim(), 10),
        cityName: row[2].trim(),
      }));
  } catch (error) {
    console.error('Error fetching search configuration:', error);
    throw error;
  }
};

/**
 * Cold Sourcing: Ensures a sheet exists for "Keyword - City".
 */
export const ensureColdSourcingSheet = async (keyword, cityName) => {
  let sheetTitle = `${keyword} - ${cityName}`;
  if (sheetTitle.length > 100) sheetTitle = sheetTitle.substring(0, 100);

  try {
    // 1. Check metadata
    const metadata = await client.spreadsheets.get({
      spreadsheetId: ROBOTA_UA_COLD_SOURCING_SPREADSHEET_ID,
    });

    const sheetExists = metadata.data.sheets.some(
      (s) => s.properties.title === sheetTitle
    );

    if (!sheetExists) {
      devLog(`Creating new sheet: "${sheetTitle}"`);

      // Changed 'resource' to 'requestBody'
      await client.spreadsheets.batchUpdate({
        spreadsheetId: ROBOTA_UA_COLD_SOURCING_SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: sheetTitle },
              },
            },
          ],
        },
      });
      const headers = [
        'ПІБ',
        'Короткий опис (Посада/Досвід)',
        'Джерело',
        'Лінк на резюме',
        'Дата додавання',
      ];

      // Changed 'resource' to 'requestBody'
      await client.spreadsheets.values.update({
        spreadsheetId: ROBOTA_UA_COLD_SOURCING_SPREADSHEET_ID,
        range: `${sheetTitle}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [headers] },
      });
    }

    return sheetTitle;
  } catch (error) {
    console.error(
      `Error ensuring sheet "${sheetTitle}":`,
      error.response?.data?.error || error.message
    );
    return null;
  }
};

/**
 * Cold Sourcing: Appends candidates.
 */
export const exportCandidatesToSheet = async (sheetTitle, candidates) => {
  if (!candidates || candidates.length === 0) return;

  const rows = candidates.map((c) => [
    c.fullName,
    `${c.title} | ${c.age || '?'} років | ${c.salaryExpectations || 'ЗП не вказана'}`,
    'robota.ua',
    c.cvURL,
    new Date().toLocaleDateString('uk-UA'),
  ]);

  try {
    await client.spreadsheets.values.append({
      spreadsheetId: ROBOTA_UA_COLD_SOURCING_SPREADSHEET_ID,
      range: `${sheetTitle}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows },
    });

    devLog(`Exported ${rows.length} candidates to "${sheetTitle}"`);
  } catch (error) {
    console.error(
      `Error appending to "${sheetTitle}":`,
      error.response?.data?.error || error.message
    );
  }
};
