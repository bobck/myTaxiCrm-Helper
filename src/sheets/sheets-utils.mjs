import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const db = await open({
  filename: process.env.DEV_DB,
  driver: sqlite3.Database,
});

export async function savePlanRow({ trips, autopark_id }) {
  const result = await db.run(
    'INSERT INTO plan(trips,autopark_id) VALUES (:trips,:autopark_id)',
    {
      ':trips': trips,
      ':autopark_id': autopark_id,
    }
  );
  return { result };
}

export async function markAllAsNotLastVersion() {
  const result = await db.run('UPDATE plan SET is_last_version = false');
  return { result };
}


import { auth, sheets } from '@googleapis/sheets';

// --- CONFIGURATION ---
// 1. The path to your service account key file
const KEY_FILE_PATH = './hb-token.json'; // Or './your-new-key-filename.json'

// 2. The ID of your spreadsheet
const SPREADSHEET_ID = '1f3gT0Ra8dn0GcRNNIUI8-u9h6R6ydrVdI7VUC5HfvHM';

// 3. The name of the sheet (tab) you want to read
const SHEET_NAME = 'Sheet1';
// --- END CONFIGURATION ---


/**
 * Fetches all data from a Google Sheet using a service account.
 */
export async function readSheetData() {
  try {
    // 1. Authenticate using the service account
    const googleAuth = new auth.GoogleAuth({
      keyFilename: KEY_FILE_PATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'], // Use .readonly for safety
    });

    // 2. Get the Sheets API client
    const client = sheets({
      version: 'v4',
      auth: googleAuth,
    });

    // 3. Make the API request to get the values
    const response = await client.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_NAME, // Using just the sheet name gets all data
    });

    // 4. Extract the rows from the response
    const rows = response.data.values;

    if (rows && rows.length) {
      console.log('Successfully retrieved data.');
      // The full data is in the 'rows' variable
      console.log(rows);
      return rows;
    } else {
      console.log('No data found in the sheet.');
      return [];
    }
  } catch (err) {
    console.error('The API returned an error:', err);
  }
}
