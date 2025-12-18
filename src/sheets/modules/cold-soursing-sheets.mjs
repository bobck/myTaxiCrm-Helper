import { getGoogleSheetClient } from '../sheets.utils.mjs';
import { devLog } from '../../shared/shared.utils.mjs';

const SPREADSHEET_ID = process.env.COLD_SOURCING_SPREADSHEET_ID;
const CONFIG_SHEET_NAME = 'Keywords'; // "Лист 1"

/**
 * Reads the search configuration from the first sheet.
 * Expected Structure: Column A = Keyword, Column B = Daily Limit
 */
export const fetchSearchConfiguration = async () => {
  const googleSheets = await getGoogleSheetClient();

  try {
    const response = await googleSheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CONFIG_SHEET_NAME}!A2:B`, // Skip header row
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      devLog('No configuration found in Google Sheets.');
      return [];
    }

    // Map rows to config objects
    return rows
      .map((row) => ({
        keyword: row[0] ? row[0].trim() : null,
        limit: row[1] ? parseInt(row[1], 10) : 20, // Default to 20 if empty
      }))
      .filter((c) => c.keyword); // Filter out empty rows
  } catch (error) {
    console.error('Error fetching search configuration:', error);
    throw error;
  }
};

/**
 * Ensures a sheet exists for a specific keyword.
 * If not, creates it and adds the standard headers.
 */
export const ensureSheetForKeyword = async (keyword) => {
  const googleSheets = await getGoogleSheetClient();
  const sheetTitle = keyword.substring(0, 99); // Sheet title limit is 100 chars

  try {
    // 1. Check if sheet exists
    const metadata = await googleSheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheetExists = metadata.data.sheets.some(
      (s) => s.properties.title === sheetTitle
    );

    // 2. If not, create it
    if (!sheetExists) {
      devLog(`Creating new sheet for keyword: ${sheetTitle}`);
      await googleSheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [
            {
              addSheet: {
                properties: { title: sheetTitle },
              },
            },
          ],
        },
      });

      // 3. Add Headers immediately after creation
      // Structure: ПІБ, короткий опис, джерело(ворк/робота), лінк на резюме, дата
      const headers = [
        'ПІБ',
        'Короткий опис (Посада/Досвід)',
        'Джерело',
        'Лінк на резюме',
        'Дата додавання',
      ];

      await googleSheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetTitle}!A1`,
        valueInputOption: 'RAW',
        resource: { values: [headers] },
      });
    }

    return sheetTitle;
  } catch (error) {
    console.error(`Error ensuring sheet for ${keyword}:`, error);
    return null;
  }
};

/**
 * Appends a list of candidates to the specific keyword sheet.
 */
export const exportCandidatesToSheet = async (sheetTitle, candidates) => {
  if (!candidates || candidates.length === 0) return;

  const googleSheets = await getGoogleSheetClient();

  // Map DTO to Row Format
  const rows = candidates.map((c) => [
    c.fullName,
    `${c.title} | ${c.age || '?'} років | ${c.salaryExpectations || 'ЗП не вказана'}`,
    'robota.ua',
    c.cvURL,
    new Date().toLocaleDateString('uk-UA'), // Current date
  ]);

  try {
    await googleSheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetTitle}!A1`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: rows },
    });

    devLog(`Exported ${rows.length} candidates to sheet "${sheetTitle}"`);
  } catch (error) {
    console.error(`Error appending to sheet ${sheetTitle}:`, error);
  }
};
