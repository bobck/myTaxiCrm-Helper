import fs from 'fs'
import path from 'path'
import os from 'os'
import {
    generateCarsRoutsReport,
    clearTableByDate,
    loadJsonToTable,
    createOrResetTableByName
} from "../bq-utils.mjs";
import { carsRoutsReportTableSchema } from '../schemas.mjs';
import { DateTime } from "luxon";

const bqTableId = 'cars_routs';

export async function generateAndSaveCarsRoutsReport() {

    const date = DateTime.now().setZone('Europe/Kyiv').minus({ days: 1 }).toFormat('yyyy-MM-dd');

    console.log({ time: new Date(), date, message: 'generateAndSaveCarsRoutsReport' });

    await clearTableByDate({ bqTableId, date });
    const { rows } = await generateCarsRoutsReport({ date });

    if (rows.length == 0) {
        return
    }

    const jsonData = rows.map(row => {
        return {
            ...row,
            date
        }
    })

    const tempFilePath = path.join(os.tmpdir(), 'temp_data_cas_routs_report.json');
    const jsonString = jsonData.map(JSON.stringify).join('\n');
    fs.writeFileSync(tempFilePath, jsonString);

    await loadJsonToTable({ json: tempFilePath, bqTableId, schema: carsRoutsReportTableSchema });
    fs.unlinkSync(tempFilePath);
}

if (process.env.ENV == "TEST") {
    // await createOrResetTableByName({ bqTableId, schema: carsRoutsReportTableSchema })
    await generateAndSaveCarsRoutsReport()
}
