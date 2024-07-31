import fs from 'fs'
import path from 'path'
import os from 'os'
import { DateTime } from "luxon";

import { getTemporaryLeaveByDriversEditingHistory } from "../../web.api.utlites.mjs";
import { clearTableByDate } from "../../../bq/bq-utils.mjs";
import { temporaryLeaveByDriversEditingHistoryTableSchema } from "../../../bq/schemas.mjs";
import {
    createOrResetTableByName,
    loadJsonToTable
} from '../../../bq/bq-utils.mjs';

const bqTableId = 'temporary_leave_drivers'

export async function saveTemporaryLeaveByDriversEditingHistory(manualDate) {
    const date = manualDate || DateTime.now().setZone('Europe/Kyiv').minus({ days: 1 }).toFormat('yyyy-MM-dd');

    console.log({ time: new Date(), date, message: 'saveTemporaryLeaveByDriversEditingHistory' });

    const { rows } = await getTemporaryLeaveByDriversEditingHistory({ date });

    console.log({ getTemporaryLeaveByDriversEditingHistory: rows.length })

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
    const tempFilePath = path.join(os.tmpdir(), 'temp_data_temporary_leave_drivers.json');
    const jsonString = jsonData.map(JSON.stringify).join('\n');
    fs.writeFileSync(tempFilePath, jsonString);

    await loadJsonToTable({ json: tempFilePath, bqTableId, schema: temporaryLeaveByDriversEditingHistoryTableSchema });

    fs.unlinkSync(tempFilePath);
}

if (process.env.ENV == "TEST") {
    // await createOrResetTableByName({ bqTableId, schema: temporaryLeaveByDriversEditingHistoryTableSchema })
    saveTemporaryLeaveByDriversEditingHistory();
}