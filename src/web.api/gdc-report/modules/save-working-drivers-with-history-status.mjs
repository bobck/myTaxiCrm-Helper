import fs from 'fs'
import path from 'path'
import os from 'os'
import { DateTime } from "luxon";

import { getWorkingDriversWithHistoryStatus } from "../../web.api.utlites.mjs";
import { clearTableByDate } from "../../../bq/bq-utils.mjs";
import { workingDriversTableSchema } from "../../../bq/schemas.mjs";
import {
    createOrResetTableByName,
    loadJsonToTable
} from '../../../bq/bq-utils.mjs';

const bqTableId = 'new_drivers_added'

export async function saveWorkingDriversWithHistoryStatus(manualDate) {
    const date = manualDate || DateTime.now().setZone('Europe/Kyiv').minus({ days: 1 }).toFormat('yyyy-MM-dd');

    console.log({ time: new Date(), date, message: 'saveWorkingDriversWithHistoryStatus' });

    const { rows } = await getWorkingDriversWithHistoryStatus({ date });

    console.log({ getWorkingDriversWithHistoryStatus: rows.length })

    if (rows.length == 0) {
        return
    }

    const jsonData = rows.map(row => {
        return {
            ...row,
            date
        }
    })

    await clearTableByDate({ bqTableId, date });
    const tempFilePath = path.join(os.tmpdir(), 'temp_data_new_drivers_added.json');
    const jsonString = jsonData.map(JSON.stringify).join('\n');
    fs.writeFileSync(tempFilePath, jsonString);

    await loadJsonToTable({ json: tempFilePath, bqTableId, schema: workingDriversTableSchema });

    fs.unlinkSync(tempFilePath);
}

if (process.env.ENV == "TEST") {
    // await createOrResetTableByName({ bqTableId, schema: workingDriversTableSchema })
    saveWorkingDriversWithHistoryStatus();
}