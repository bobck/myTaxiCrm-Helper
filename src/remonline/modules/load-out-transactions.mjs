import {
  createOrResetRemonlineTransactionTables,
  loadRemonlineTransactionsToBQ,
} from '../../bq/modules/load-remonline-transactions.mjs';
import { remonlineTokenToEnv } from '../../remonline/remonline.api.mjs';
import {
  getCaboxesWithCrmMapping,
  getCaboxesWithCrmMappingThatDontExistInBQ,
  getCashFlowItemIdsThatExistInBQ,
  markCashboxAsSynchronizedWithBQ,
} from '../../remonline/remonline.queries.mjs';
import { getCashboxTransactions } from '../../remonline/remonline.utils.mjs';
import { devLog } from '../../shared/shared.utils.mjs';
import { createCRMApplicationsFromRemonlineTransaction } from '../../web.api/modules/applications-from-remonline-transactions.mjs';
export const loadOutRemonlineTransactions = async () => {
  console.log({
    module: 'loadRemonlineTransactionsToBQ',
    date: new Date(),
  });

  const cashboxes = await getCaboxesWithCrmMapping();

  const bigQueryData = {
    cashboxes: [],
    cashFlowItems: [],
    cashboxTransactions: [],
  };
  const uniqueCashFlowItems = [];
  const CRMTransactionMap = new Map();
  for (const cashbox of cashboxes) {
    const {
      id: remonlineCashboxId,
      last_transaction_created_at,
      auto_park_cashbox_id: cashboxId,
    } = cashbox;
    devLog({
      id: remonlineCashboxId,
      last_transaction_created_at,
      auto_park_cashbox_id: cashboxId,
    });
    const { transactions } = await getCashboxTransactions({
      cashboxId: remonlineCashboxId,
      // createdAt: 1735686000000,
      createdAt:
        last_transaction_created_at == null
          ? null
          : last_transaction_created_at + 1000,
    });
    CRMTransactionMap.set(cashboxId, transactions);

    const handledTransactions = transactions.map((transaction) => {
      const {
        id,
        value,
        direction,
        employee_id,
        created_at,
        description,
        client_id,
        related_document,
        cashflow_item,
      } = transaction;
      const { id: related_document_id, type: related_document_type } =
        related_document ? related_document : { id: null, type: null };
      if (
        cashflow_item &&
        cashflow_item.id &&
        !uniqueCashFlowItems.some(
          (cashFlowItem) => cashFlowItem.id == cashflow_item.id
        )
      ) {
        uniqueCashFlowItems.push(cashflow_item);
      }
      return {
        id,
        remonline_cashbox_id: remonlineCashboxId,
        value,
        direction,
        employee_id,
        created_at,
        description,
        client_id,
        related_document_id,
        related_document_type,
        cashflow_item_id: cashflow_item ? cashflow_item.id : null,
      };
    });
    bigQueryData.cashboxTransactions.push(...handledTransactions);
    devLog(remonlineCashboxId, 'done');
  }

  const cashboxesToSyncWithBQ =
    await getCaboxesWithCrmMappingThatDontExistInBQ();
  const existingCashflowItemIdsInBQ = await getCashFlowItemIdsThatExistInBQ();

  const cashflowItems = uniqueCashFlowItems.filter((item) =>
    existingCashflowItemIdsInBQ.some(({ id }) => item.id && id == item.id)
  );

  bigQueryData.cashFlowItems.push(...cashflowItems);
  bigQueryData.cashboxes.push(...cashboxesToSyncWithBQ);
  await loadRemonlineTransactionsToBQ(bigQueryData);
  await createCRMApplicationsFromRemonlineTransaction(CRMTransactionMap);
};
if (process.env.ENV === 'DEV') {
  await remonlineTokenToEnv(true);
  await createOrResetRemonlineTransactionTables();
  // createOrResetRemonlineTransactionTables()
  await loadOutRemonlineTransactions();
  // await resetUOMTable();
}
