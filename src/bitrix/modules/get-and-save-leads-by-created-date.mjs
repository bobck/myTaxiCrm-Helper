import fs from 'fs'
import path from 'path'
import os from 'os'
import { DateTime } from "luxon";

import { getLeadsByCreateDateAndAssigned } from "../bitrix.utils.mjs";

import {
    createOrResetLeadsTable,
    loadJsonToTable,
    clearLeadsTableByDate
} from "../../bq/bq-utils.mjs";

export async function getAndSaveLeadsByCreatedDate() {
    const date = DateTime.now().setZone('Europe/Kyiv').minus({ days: 1 }).toFormat('yyyy-MM-dd');
    console.log({ time: new Date(), date, message: 'generateAndSaveDriversWithFuelCardsReport' });

    const bqTableId = 'leads_own'
    const assigned = ['109046', '88062', '79570', '112604', '50222', '110576', '66110', '103156', '46392', '128320']

    const result = await getLeadsByCreateDateAndAssigned({ date, assigned })

    console.log({ getLeadsByCreateDateAndAssigned: result.length })

    const jsonData = result.map(row => {
        const { ID, SOURCE_ID, UF_CRM_1688301710585 } = row
        return {
            id: ID,
            source_id: SOURCE_ID,
            is_duplicate: (UF_CRM_1688301710585 == '0') ? false : true,
            date
        }
    })

    await clearLeadsTableByDate({ bqTableId, date });
    const tempFilePath = path.join(os.tmpdir(), 'temp_data.json');
    const jsonString = jsonData.map(JSON.stringify).join('\n');
    fs.writeFileSync(tempFilePath, jsonString);

    await loadJsonToTable({ json: tempFilePath, bqTableId });

    fs.unlinkSync(tempFilePath);
}

if (process.env.ENV == "TEST") {
    // await createOrResetLeadsTable()
    await getAndSaveLeadsByCreatedDate()
}
