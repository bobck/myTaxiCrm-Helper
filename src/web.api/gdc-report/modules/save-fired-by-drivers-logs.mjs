import fs from 'fs'
import path from 'path'
import os from 'os'
import { DateTime } from "luxon";

import { getFiredByDriversLogs } from "../../web.api.utlites.mjs";
import { clearTableByDate } from "../../../bq/bq-utils.mjs";
import { firedByDriversLogsTableSchema } from "../../../bq/schemas.mjs";
import {
    createOrResetTableByName,
    loadJsonToTable
} from '../../../bq/bq-utils.mjs';

const bqTableId = 'fired_by_drivers_logs'

export async function saveFiredByDriversLogs(manualDate) {
    const date = manualDate || DateTime.now().setZone('Europe/Kyiv').minus({ days: 1 }).toFormat('yyyy-MM-dd');

    console.log({ time: new Date(), date, message: 'saveFiredByDriversLogs' });

    const { rows } = await getFiredByDriversLogs({ date });

    console.log({ getFiredByDriversLogs: rows.length })

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
    const tempFilePath = path.join(os.tmpdir(), 'temp_data_fired_by_drivers_logs.json');
    const jsonString = jsonData.map(JSON.stringify).join('\n');
    fs.writeFileSync(tempFilePath, jsonString);

    await loadJsonToTable({ json: tempFilePath, bqTableId, schema: firedByDriversLogsTableSchema });

    fs.unlinkSync(tempFilePath);
}

if (process.env.ENV == "TEST") {
    // await createOrResetTableByName({ bqTableId, schema: firedByDriversLogsTableSchema })
    saveFiredByDriversLogs();
}