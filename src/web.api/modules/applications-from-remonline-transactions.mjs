import {
    createCashlessPaymentApplication,
    repairExpensesTypes,
    editCashlessPaymentApplication,
    payApplication
} from "../web.api.utlites.mjs";
import { getCashboxTransactions } from "../../remonline/remonline.utils.mjs";
import {
    getCaboxesWithCrmMapping,
    updateLastCreatedTransactionTimeFoxRemonlineCashbox
} from "../../remonline/remonline.queries.mjs";

import {
    saveCreatedCashlessApplicationId,
    updateSavedCashlessApplicationId,
    getContractorIdByName
} from "../web.api.queries.mjs";


export async function createCRMApplicationsFromRemonlineTransaction() {
    const cashboxes = await getCaboxesWithCrmMapping();

    for (let cashbox of cashboxes) {

        const {
            id: remonlineCashboxId,
            last_transaction_created_at,
            auto_park_id: autoParkId,
            auto_park_cashbox_id: cashboxId,
            default_contator_id,
            usa_contator_id,
            scooter_contator_id
        } = cashbox

        console.log({ message: 'createCRMApplicationsFromRemonlineTransaction', remonlineCashboxId, last_transaction_created_at, cashboxId })

        const { transactions } = await getCashboxTransactions(
            {
                cashboxId: remonlineCashboxId,
                createdAt: last_transaction_created_at == null ? null : last_transaction_created_at + 1000
            });
        for (let transaction of transactions) {

            const { id: transactionId, value, direction, description, created_at } = transaction

            const toBeSkipped = /^\*\*\*/.test(description.replaceAll(' ',''));

            if (toBeSkipped) {
                continue
            }

            const [expenseCode, contatorFullCode, carCode, sid] = description.split(';');

            const expenseType = repairExpensesTypes[expenseCode] || process.env.DEFAULT_EXPENSE_TYPE

            let contractorId = null;

            if (contatorFullCode) {
                const contatorCode = contatorFullCode.split('.')[1];
                if (contatorCode == '02' && usa_contator_id) {
                    contractorId = usa_contator_id
                }

                if (contatorCode == '03' && scooter_contator_id) {
                    contractorId = scooter_contator_id
                }

                if (!contractorId) {
                    const { id: _contractorId } = await getContractorIdByName(contatorFullCode.trim()) || {};
                    contractorId = _contractorId;
                }

            }

            if (!contractorId) {
                contractorId = default_contator_id;
            }

            let type = 'BUSINESS_REVENUE_AUTO_PARK'
            if (direction == 1) {
                type = 'BUSINESS_EXPENSE_AUTO_PARK'
            }
            try {

                const { cashlessPaymentApplication } = await createCashlessPaymentApplication({
                    type,
                    autoParkId,
                    cashboxId,
                    expenseType,
                    sum: value,
                    contractorId,
                    payByDate: new Date().toISOString(),
                    comment: description,
                    carId: process.env.DEFAULT_CAR_ID
                })

                const { id: applicationId } = cashlessPaymentApplication

                await updateLastCreatedTransactionTimeFoxRemonlineCashbox({ createdAt: created_at, remonlineCashboxId });
                await saveCreatedCashlessApplicationId({ id: applicationId, autoParkId, remonlineTransactionId: transactionId })

                const { cashlessPaymentApplication: cashlessPaymentApplicationOnEdit } = await editCashlessPaymentApplication({
                    applicationId,
                    status: 'APPROVED'
                })

                await updateSavedCashlessApplicationId({ id: applicationId, status: 'APPROVED' })

                const { status } = cashlessPaymentApplicationOnEdit

                try {
                    const { payApplication: payApplicationResponse } = await payApplication({ applicationId, autoParkId });
                    const { success } = payApplicationResponse
                    await updateSavedCashlessApplicationId({ id: applicationId, status: 'PAYED' })
                } catch (e) {
                    console.error({ e, applicationId })
                    await updateSavedCashlessApplicationId({ id: applicationId, status: JSON.stringify(e) })
                }

            } catch (error) {
                console.error({ transactionId, created_at, cashboxId, error });
                break;
            }

        }

    }
}


if (process.env.ENV == "TEST") {
    createCRMApplicationsFromRemonlineTransaction();
}
