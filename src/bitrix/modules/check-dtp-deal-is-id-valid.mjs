import { getDtpDealById } from "../bitrix.utils.mjs";
import {
    getDtpDebtTransactionsForValidation,
    markDtpDebtTransactionsIsValid,
    markDtpDebtTransactionsIsNotValid
} from "../bitrix.queries.mjs";

export async function checkDtpDealIdIsValid() {

    console.log({ time: new Date(), message: 'checkIsDtpDealIdValid' })
    
    const { dtpDebtTransactionsForValidation } = await getDtpDebtTransactionsForValidation();
    const uniqueIds = [...new Set(dtpDebtTransactionsForValidation.map(obj => obj.dtp_deal_id))];

    for (let id of uniqueIds) {
        const { total } = await getDtpDealById({ id })
        console.log({ id, total })

        if (total === 0) {
            markDtpDebtTransactionsIsNotValid({ id });
        } else if (total === 1) {
            markDtpDebtTransactionsIsValid({ id });
        }

    }

}


if (process.env.ENV == "TEST") {
    await checkDtpDealIdIsValid();
}
