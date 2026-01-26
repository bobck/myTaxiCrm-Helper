import {
  createCashlessPaymentApplication,
  repairExpensesTypes,
  editCashlessPaymentApplication,
  payApplication,
} from '../web.api.utlites.mjs';
import {
  getCaboxesWithCrmMapping,
  updateLastCreatedTransactionTimeFoxRemonlineCashbox,
} from '../../remonline/remonline.queries.mjs';

import {
  saveCreatedCashlessApplicationId,
  updateSavedCashlessApplicationId,
  getContractorIdByName,
} from '../web.api.queries.mjs';
import { getCashboxTransActionsByCashboxIdCreatedLaterThan } from '../../remonline/remonline.prisma.mjs';
import { devLog } from '../../shared/shared.utils.mjs';

export async function createCRMApplicationsFromRemonlineTransaction() {
  console.log({ message: 'createCRMApplicationsFromRemonlineTransaction' });

  const cashboxes = await getCaboxesWithCrmMapping();

  for (let cashbox of cashboxes) {
    const {
      id: remonlineCashboxId,
      last_transaction_created_at,
      auto_park_id: autoParkId,
      auto_park_cashbox_id: cashboxId,
      default_contator_id,
      usa_contator_id,
      scooter_contator_id,
    } = cashbox;

    try {
      const rawTransactions =
        await getCashboxTransActionsByCashboxIdCreatedLaterThan({
          cashboxId: Number(remonlineCashboxId),
          last_transaction_created_at,
        });

      const transactions = rawTransactions.map((t) => ({
        id: t.id,
        value: t.value,
        direction: t.direction,
        description: t.description,
        created_at: Number(t.createdAt),
      }));
      for (let transaction of transactions) {
        const {
          id: transactionId,
          value,
          direction,
          description,
          created_at,
        } = transaction;
        if (value > 99_999_999.99 || value < -99_999_999.99) {
          console.error(
            `the value:${value} is out of float[numeric(10,2)] range which is [-99_999_999.99; 99_999_999.99]`
          );
          continue;
        }
        const toBeSkipped = /^\*\*\*/.test(description.replaceAll(' ', ''));

        if (toBeSkipped) {
          continue;
        }

        let customExpenseCode = null;

        if (/^Переміщення грошей/.test(description)) {
          customExpenseCode = '5.1';
        }

        const [expenseCode, contatorFullCode, carCode, sid] =
          description.split(';');

        const expenseType =
          repairExpensesTypes[expenseCode] ||
          repairExpensesTypes[customExpenseCode] ||
          process.env.DEFAULT_EXPENSE_TYPE;

        let contractorId = null;

        if (contatorFullCode) {
          const contatorCode = contatorFullCode.split('.')[1];
          if (contatorCode == '02' && usa_contator_id) {
            contractorId = usa_contator_id;
          }

          if (contatorCode == '03' && scooter_contator_id) {
            contractorId = scooter_contator_id;
          }

          if (!contractorId) {
            const { id: _contractorId } =
              (await getContractorIdByName(contatorFullCode.trim())) || {};
            contractorId = _contractorId;
          }
        }

        if (!contractorId) {
          contractorId = default_contator_id;
        }

        let type = 'BUSINESS_REVENUE_AUTO_PARK';
        if (direction == 1) {
          type = 'BUSINESS_EXPENSE_AUTO_PARK';
        }
        try {
          const { cashlessPaymentApplication } =
            await createCashlessPaymentApplication({
              type,
              autoParkId,
              cashboxId,
              expenseType,
              sum: value,
              contractorId,
              payByDate: new Date().toISOString(),
              comment: description,
              carId: process.env.DEFAULT_CAR_ID,
            });

          const { id: applicationId } = cashlessPaymentApplication;

          await updateLastCreatedTransactionTimeFoxRemonlineCashbox({
            createdAt: created_at,
            remonlineCashboxId,
          });
          await saveCreatedCashlessApplicationId({
            id: applicationId,
            autoParkId,
            remonlineTransactionId: transactionId,
          });

          const {
            cashlessPaymentApplication: cashlessPaymentApplicationOnEdit,
          } = await editCashlessPaymentApplication({
            applicationId,
            status: 'APPROVED',
          });

          await updateSavedCashlessApplicationId({
            id: applicationId,
            status: 'APPROVED',
          });

          const { status } = cashlessPaymentApplicationOnEdit;

          try {
            const { payApplication: payApplicationResponse } =
              await payApplication({ applicationId, autoParkId });
            const { success } = payApplicationResponse;
            await updateSavedCashlessApplicationId({
              id: applicationId,
              status: 'PAYED',
            });
          } catch (e) {
            console.log({
              date: new Date(),
              message: e?.message,
              applicationId,
            });
            await updateSavedCashlessApplicationId({
              id: applicationId,
              status: JSON.stringify(e),
            });
          }
        } catch (error) {
          console.error({
            name: 'createCRMApplicationsFromRemonlineTransaction',
            date: new Date(),
            error,
            transactionId,
            created_at,
            cashboxId,
            contractorId,
            remonlineCashboxId,
          });
          break;
        }
      }
    } catch (e) {
      console.log({
        message: `Skip remonlineCashboxId: ${remonlineCashboxId} in createCRMApplicationsFromRemonlineTransaction`,
        reason: e,
      });
    }
  }
}

if (process.env.ENV == 'DEV') {
  createCRMApplicationsFromRemonlineTransaction();
}
