import { DateTime } from "luxon";
import { getDtpDebtTransactions } from '../bitrix.utils.mjs';
import {
    saveDtpDebtTransactions,
    lastsaveDtpDebtTransactionDate
} from '../bitrix.queries.mjs';

function formatCreatedAt(createdAt) {
    return DateTime.fromJSDate(createdAt, { zone: 'UTC' })
        .toSQL()
}

export async function getAndSaveDtpDebtTransactions() {

    const { created_at } = await lastsaveDtpDebtTransactionDate();

    console.log({ time: new Date(), message: 'getAndSaveDtpDebtTransactions', created_at })

    const { rows } = await getDtpDebtTransactions({ createdAt: DateTime.fromSQL(created_at).plus({ milliseconds: 1 }).toSQL() })

    if (rows.length == 0) {
        return
    }

    const dtpDebtTransactions = rows.map(row => {
        const { auto_park_id, driver_id, human_id, purpose, sum, added_by_user_name, dtp_deal_id, created_at } = row
        return { auto_park_id, driver_id, human_id, purpose, sum, added_by_user_name, dtp_deal_id, created_at: formatCreatedAt(created_at) }
    })
    console.log(`${dtpDebtTransactions.length} dtpDebtTransactions to save`);
    await saveDtpDebtTransactions(dtpDebtTransactions);
}

if (process.env.ENV == "TEST") {
    await getAndSaveDtpDebtTransactions();
}
