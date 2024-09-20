import fs from 'fs'
import path from 'path'
import os from 'os'
import { DateTime } from "luxon";

import { getCarTransferAcceptanceList } from "../../web.api.utlites.mjs";
import { clearTableByDate } from "../../../bq/bq-utils.mjs";
import { carTransferAcceptanceListTableSchema } from "../../../bq/schemas.mjs";
import {
    createOrResetTableByName,
    loadJsonToTable
} from '../../../bq/bq-utils.mjs';

const bqTableId = 'car_transfer_acceptance_list'

export async function saveCarTransferAcceptanceList(manualDate) {
    const date = manualDate || DateTime.now().setZone('Europe/Kyiv').minus({ days: 1 }).toFormat('yyyy-MM-dd');

    console.log({ time: new Date(), date, message: 'saveCarTransferAcceptanceList' });

    const { rows } = await getCarTransferAcceptanceList({ date });

    console.log({ getCarTransferAcceptanceList: rows.length })

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
    const tempFilePath = path.join(os.tmpdir(), 'temp_data_car_transfer_acceptance_list.json');
    const jsonString = jsonData.map(JSON.stringify).join('\n');
    fs.writeFileSync(tempFilePath, jsonString);

    await loadJsonToTable({ json: tempFilePath, bqTableId, schema: carTransferAcceptanceListTableSchema });

    fs.unlinkSync(tempFilePath);
}

if (process.env.ENV == "TEST") {
    // await createOrResetTableByName({ bqTableId, schema: carTransferAcceptanceListTableSchema })
    saveCarTransferAcceptanceList();
}