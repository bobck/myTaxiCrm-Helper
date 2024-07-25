import {
    generateFleetsIncomAndExpensesReport,
    clearFleetsIncomAndExpensesReportTableByYearAndWeek,
    insertRowsAsStream
} from "../bq-utils.mjs";
import { DateTime } from "luxon";

export async function generateAndSaveFleetsIncomAndExpensesReport() {
    console.log({ time: new Date(), message: 'generateAndSaveFleetsIncomAndExpensesReport' });

    const now = DateTime.now();

    const pastDate = now.minus({ weeks: 8 });

    const week = pastDate.weekNumber;
    const year = pastDate.year;

    await clearFleetsIncomAndExpensesReportTableByYearAndWeek({ bqTableId: 'fleet_income_and_expenses', year, week });
    const { rows } = await generateFleetsIncomAndExpensesReport({ year, week });
    const rownWithValues = rows.filter(r => r.sum != 0)

    try {
        let chunkSize = 10000
        for (let i = 0; i < rownWithValues.length; i += chunkSize) {
            const chunk = rownWithValues.slice(i, i + chunkSize);
            await insertRowsAsStream({ rows: chunk, bqTableId: 'fleet_income_and_expenses' });
        }

    } catch (e) {
        console.error(e)
    }
}

if (process.env.ENV == "TEST") {
    await generateAndSaveFleetsIncomAndExpensesReport()
}
