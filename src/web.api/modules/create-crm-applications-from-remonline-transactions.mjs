import { createCashlessPaymentApplication } from "../web.api.utlites.mjs";
import { getCashboxTransactions } from "../../remonline/remonline.utils.mjs";
import {
    getCaboxesWithCrmMapping,
    updateLastCreatedTransactionTimeFoxRemonlineCashbox
} from "../../remonline/remonline.queries.mjs";

import { saveCreatedCashlessApplicationId } from "../web.api.queries.mjs";


export async function createCRMApplicationsFromRemonlineTransaction() {
    process.env.runs_createCRMApplicationsFromRemonlineTransaction = true;

    const cashboxes = await getCaboxesWithCrmMapping();

    for (let cashbox of cashboxes) {

        const {
            id: remonlineCashboxId,
            last_transaction_created_at,
            auto_park_id: autoParkId,
            auto_park_cashbox_id: cashboxId,
            auto_park_contator_id: contractorId,
            custom_contator_id
        } = cashbox

        console.log({ message: 'createCRMApplicationsFromRemonlineTransaction', remonlineCashboxId, last_transaction_created_at, cashboxId })

        const { transactions } = await getCashboxTransactions(
            {
                cashboxId: remonlineCashboxId,
                createdAt: last_transaction_created_at == null ? null : last_transaction_created_at + 1000
            });
        for (let transaction of transactions) {

            const { id: transactionId, value, direction, description, created_at } = transaction

            let type = 'BUSINESS_REVENUE_AUTO_PARK'
            if (direction == 1) {
                type = 'BUSINESS_EXPENSE_AUTO_PARK'
            }
            try {
                const { cashlessPaymentApplication } = await createCashlessPaymentApplication({
                    type,
                    autoParkId,
                    cashboxId,
                    expenseType: process.env.DEFAULT_EXPENSE_TYPE,
                    sum: value,
                    contractorId,
                    payByDate: new Date().toISOString(),
                    comment: description
                })
                const { id: aplicationId } = cashlessPaymentApplication
                await saveCreatedCashlessApplicationId({ id: aplicationId, autoParkId, remonlineTransactionId: transactionId })
                await updateLastCreatedTransactionTimeFoxRemonlineCashbox({ createdAt: created_at, remonlineCashboxId });

            } catch (error) {
                console.error({ transactionId, created_at, cashboxId, error });
                break;
            }

        }

    }
    process.env.runs_createCRMApplicationsFromRemonlineTransaction = false;

}


if (process.env.ENV == "TEST") {
    createCRMApplicationsFromRemonlineTransaction();
}
