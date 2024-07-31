import fs from 'fs'
import path from 'path'
import os from 'os'
import { DateTime } from "luxon";

import { getUniqWorkedDriversAndAvgLifeTime } from "../../web.api.utlites.mjs";
import { clearTableByWeekAndYear } from "../../../bq/bq-utils.mjs";
import { uniqWorkedDriversAndAvgLifeTimeTableSchema } from "../../../bq/schemas.mjs";
import {
    createOrResetTableByName,
    loadJsonToTable
} from '../../../bq/bq-utils.mjs';

const bqTableId = 'worked_drivers_with_life_time'

export async function saveUniqWorkedDriversAndAvgLifeTime(dateTime) {
    const dateTimeReport = dateTime || DateTime.now().setZone('Europe/Kyiv').minus({ days: 1 })
    const week = dateTimeReport.weekNumber
    const year = dateTimeReport.year

    console.log({ time: new Date(), week, year, message: 'saveUniqWorkedDriversAndAvgLifeTime' });

    const { rows } = await getUniqWorkedDriversAndAvgLifeTime({ week, year });

    console.log({ getUniqWorkedDriversAndAvgLifeTime: rows.length })
    
    if (rows.length == 0) {
        return
    }
    const currentDateTime = DateTime.now().setZone('Europe/Kyiv')
    const currentWeek = currentDateTime.weekNumber
    const currentYear = currentDateTime.year

    let firstDayOfTargetYear = DateTime.fromObject({ year: year, month: 1, day: 1 });
    if (firstDayOfTargetYear.weekday !== 1) {
        firstDayOfTargetYear = firstDayOfTargetYear.plus({ days: 8 - firstDayOfTargetYear.weekday });
    }

    const firstDayOfTargetWeek = firstDayOfTargetYear.plus({ weeks: week - 1 });
    const lastDayOfTargetWeek = firstDayOfTargetWeek.plus({ days: 6 });

    const jsonData = rows.map(row => {
        const { driver_created_at } = row

        let life_days

        const dateFromSQL = DateTime.fromSQL(driver_created_at, { zone: 'europe/kyiv' });

        if (year == currentYear && week == currentWeek) {
            const difference = dateFromSQL.diffNow('days').as('days');
            life_days = Math.abs(difference);
        }

        if (year != currentYear || week != currentWeek) {
            const difference = lastDayOfTargetWeek.diff(dateFromSQL, 'days').as('days');
            life_days = Math.abs(difference);
        }

        return {
            ...row,
            life_days,
            year,
            week
        }
    })

    await clearTableByWeekAndYear({ bqTableId, year, week });
    const tempFilePath = path.join(os.tmpdir(), 'temp_data_worked_drivers_with_life_time.json');
    const jsonString = jsonData.map(JSON.stringify).join('\n');
    fs.writeFileSync(tempFilePath, jsonString);

    await loadJsonToTable({ json: tempFilePath, bqTableId, schema: uniqWorkedDriversAndAvgLifeTimeTableSchema });

    fs.unlinkSync(tempFilePath);
}

if (process.env.ENV == "TEST") {
    // await createOrResetTableByName({ bqTableId, schema: uniqWorkedDriversAndAvgLifeTimeTableSchema })
    saveUniqWorkedDriversAndAvgLifeTime();
}