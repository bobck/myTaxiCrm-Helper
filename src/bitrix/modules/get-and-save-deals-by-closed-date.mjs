import fs from 'fs'
import path from 'path'
import os from 'os'
import { DateTime } from "luxon";

import { getDealsByClosedDate } from "../bitrix.utils.mjs";

import {
    createOrResetDealsHrClosedTable,
    loadJsonToTable,
    clearTableByDate
} from "../../bq/bq-utils.mjs";

import { dealsHrClosedTableSchema } from '../../bq/schemas.mjs';

export async function getAndSaveDealsByClosedDate(manualDate) {
    const date = manualDate || DateTime.now().setZone('Europe/Kyiv').minus({ days: 1 }).toFormat('yyyy-MM-dd');
    console.log({ time: new Date(), date, message: 'getAndSaveDealsByClosedDate' });

    const bqTableId = 'deals_hr_closed'

    const result = await getDealsByClosedDate({ date })

    console.log({ getDealsByClosedDate: result.length })

    if (result.length == 0) {
        return
    }

    const jsonData = result.map(row => {
        const { ID, SOURCE_ID, STAGE_ID, UF_CRM_1527615815 } = row
        return {
            id: ID,
            source_id: SOURCE_ID,
            city_id: UF_CRM_1527615815,
            stage_id: STAGE_ID,
            date
        }
    })

    await clearTableByDate({ bqTableId, date });
    const tempFilePath = path.join(os.tmpdir(), 'temp_data_deals_hr_closed.json');
    const jsonString = jsonData.map(JSON.stringify).join('\n');
    fs.writeFileSync(tempFilePath, jsonString);

    await loadJsonToTable({ json: tempFilePath, bqTableId, schema: dealsHrClosedTableSchema });

    fs.unlinkSync(tempFilePath);
}

if (process.env.ENV == "TEST") {
    const bqTableId = 'deals_hr_closed'
    // await createOrResetDealsHrClosedTable({ bqTableId })
    await getAndSaveDealsByClosedDate()
}
