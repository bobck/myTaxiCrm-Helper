import {
    addCommentToDtpDeal,
    getDtpDealById,
    updateDealDebt,
    updateDealPayOff
} from "../bitrix.utils.mjs";
import {
    getDtpAccrueDebtTransactions,
    markDtpDebtTransactionsAsSync
} from "../bitrix.queries.mjs";

export async function accrueDebtToDeal() {

    const { dtpAccrueDebtTransactions } = await getDtpAccrueDebtTransactions();

    console.log({ time: new Date(), message: 'accrueDebtToDeal', dtpAccrueDebtTransactions: dtpAccrueDebtTransactions.length })


    for (let transactions of dtpAccrueDebtTransactions) {
        const { auto_park_id,
            driver_id,
            human_id,
            purpose,
            added_by_user_name,
            dtp_deal_id,
            sum } = transactions

        const { result: dealArray } = await getDtpDealById({ id: dtp_deal_id });
        const [deal] = dealArray

        const {
            UF_CRM_1654076033: accruedDebt,
            UF_CRM_1654075693: voluntaryPayOff,
            UF_CRM_1654075624: forcedPayOff
        } = deal

        if (purpose == 'TOP_UP_DEBT') {
            await accruedDebtToDeal({ accruedDebt, sum, dtp_deal_id, added_by_user_name, human_id, auto_park_id, driver_id });
        }

        if (purpose == 'VOLUNTARY_PAY_OFF_DEBT' || purpose == 'PAY_OFF_DEBT_DEPOSIT_ACCOUNT') {
            const ufCrmField = 'UF_CRM_1654075693'
            await voluntaryPayOffToDeal({ voluntaryPayOff, sum, dtp_deal_id, added_by_user_name, human_id, auto_park_id, driver_id, ufCrmField });
        }

        if (purpose == 'FORCED_PAY_OFF_DEBT') {
            const ufCrmField = 'UF_CRM_1654075624'
            await forcedPayOffToDeal({ forcedPayOff, sum, dtp_deal_id, added_by_user_name, human_id, auto_park_id, driver_id, ufCrmField });
        }
    }
}

async function forcedPayOffToDeal({ forcedPayOff, sum, dtp_deal_id, added_by_user_name, human_id, auto_park_id, driver_id, ufCrmField }) {

    const currentForcedPayOff = parseFloat(forcedPayOff) + sum;

    const { result } = await updateDealPayOff({ id: dtp_deal_id, ufCrmField, amount: currentForcedPayOff });

    if (!result) {
        throw {
            message: 'Unable to updateDealPayOff',
            dtp_deal_id,
            forcedPayOff,
            currentForcedPayOff,
            sum
        }
    }

    const comment = `Примусове погашення боргу у розмірі ${sum} грн.
Загальна сумма примусового погашення: ${currentForcedPayOff}
        
Нарахуваво: ${added_by_user_name}
Транзакція: ${human_id}
        
Посилання на карту водія MyTaxiCRM:
https://fleets.mytaxicrm.com/${auto_park_id}/drivers/${driver_id}`

    await addCommentToDtpDeal({ id: dtp_deal_id, comment });
    await markDtpDebtTransactionsAsSync({ human_id });    

}

async function voluntaryPayOffToDeal({ voluntaryPayOff, sum, dtp_deal_id, added_by_user_name, human_id, auto_park_id, driver_id, ufCrmField }) {

    const currentVoluntaryPayOff = parseFloat(voluntaryPayOff) + sum;

    const { result } = await updateDealPayOff({ id: dtp_deal_id, ufCrmField, amount: currentVoluntaryPayOff });

    if (!result) {
        throw {
            message: 'Unable to updateDealPayOff',
            dtp_deal_id,
            voluntaryPayOff,
            currentVoluntaryPayOff,
            sum
        }
    }

    const comment = `Добровільне погашення боргу у розмірі ${sum} грн.
Загальна сумма добровільного погашення: ${currentVoluntaryPayOff}
        
Нарахуваво: ${added_by_user_name}
Транзакція: ${human_id}
        
Посилання на карту водія MyTaxiCRM:
https://fleets.mytaxicrm.com/${auto_park_id}/drivers/${driver_id}`

    await addCommentToDtpDeal({ id: dtp_deal_id, comment });
    await markDtpDebtTransactionsAsSync({ human_id });

}

async function accruedDebtToDeal({ accruedDebt, sum, dtp_deal_id, added_by_user_name, human_id, auto_park_id, driver_id }) {

    const currentDebt = parseFloat(accruedDebt) + sum;

    const { result } = await updateDealDebt({ id: dtp_deal_id, debt: currentDebt });

    if (!result) {
        throw {
            message: 'Unable to updateDealDebt',
            dtp_deal_id,
            accruedDebt,
            currentDebt,
            sum
        }
    }

    const comment = `Нараховано борг у розмірі ${sum} грн.
Борг ДТП після нарахування: ${currentDebt}
    
Нарахуваво: ${added_by_user_name}
Транзакція: ${human_id}
    
Посилання на карту водія MyTaxiCRM:
https://fleets.mytaxicrm.com/${auto_park_id}/drivers/${driver_id}`

    await addCommentToDtpDeal({ id: dtp_deal_id, comment });
    await markDtpDebtTransactionsAsSync({ human_id });
}


if (process.env.ENV == "TEST") {
    await accrueDebtToDeal();
}