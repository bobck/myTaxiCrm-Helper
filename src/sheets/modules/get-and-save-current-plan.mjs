import {
  auth,
  sheets
} from '@googleapis/sheets';
import {
  savePlanRow,
  markAllAsNotLastVersion
} from '../sheets-utils.mjs';

export async function getAndSaveCurrentPlan() {
  console.log({ time: new Date(), message: 'getAndSaveCurrentPlan' })

  const googleAuth = new auth.GoogleAuth({
    keyFilename: './token.json',
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  const client = sheets({ version: "v4", auth: googleAuth });
  const response = await client.spreadsheets.values.get({
    spreadsheetId: process.env.TRIPS_PLAN_SS_ID,
    range: process.env.TRIPS_PLAN_SHEET_RANGE
  });

  const { data } = response
  const { values: rows } = data
  await markAllAsNotLastVersion();
  for (let row of rows) {
    const [trips, autopark_id] = row

    if (isNaN(trips)) {
      continue;
    }
    
    await savePlanRow({ trips, autopark_id });
  }

}

if (process.env.ENV == "TEST") {
  getAndSaveCurrentPlan();
}

