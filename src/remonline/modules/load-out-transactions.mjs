import { remonlineTokenToEnv } from '../../remonline/remonline.api.mjs';
import { getCaboxesWithCrmMapping } from '../../remonline/remonline.queries.mjs';
import { getCashboxTransactions } from '../../remonline/remonline.utils.mjs';
import { devLog } from '../../shared/shared.utils.mjs';
import { createOrResetTableByName, loadRowsViaJSONFile } from '../bq-utils.mjs';
import {
  cashboxTransactionsTableSchema,
  cashFlowItemsTableSchema,
  remonlineCashboxesTableSchema,
} from '../schemas.mjs';
const cashboxTransactionTableId = 'cashbox_trasactions';
const cashFlowItemTableId = 'cashflow_items';
const remonlineCashBoxTableId = 'cashboxes';
const dataSetId = 'RemOnline';
export const loadOutRemonlineTransactions = async () => {
  console.log({
    module: 'loadRemonlineTransactionsToBQ',
    date: new Date(),
  });

  const cashboxes = await getCaboxesWithCrmMapping();

  const bigQueryData = {
    cashboxes,
    uniqueCashFlowItems: [],
    allCashboxTransactions: [],
  };
  const CRMData = new Map();
  for (const cashbox of cashboxes) {
    const {
      id: remonlineCashboxId,
      last_transaction_created_at,
      auto_park_id: autoParkId,
      auto_park_cashbox_id: cashboxId,
      default_contator_id,
      usa_contator_id,
      scooter_contator_id,
    } = cashbox;

    const { transactions } = await getCashboxTransactions({
      cashboxId: remonlineCashboxId,
      createdAt: 1735686000000,
      //   createdAt:
      //       last_transaction_created_at == null
      //         ? null
      //         : last_transaction_created_at + 1000,
    });

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
    allCashboxTransactions.push(...handledTransactions);
    devLog(remonlineCashboxId, 'done');
  }
  devLog({
    allCashboxTransactionExample: allCashboxTransactions[0],
    uniqueCashFlowItemExample: uniqueCashFlowItems[0],
    allCashboxTransactions: allCashboxTransactions.length,
    uniqueCashFlowItems: uniqueCashFlowItems.length,
  });

  await loadRowsViaJSONFile({
    dataset_id: dataSetId,
    table_id: cashboxTransactionTableId,
    schema: cashboxTransactionsTableSchema,
    rows: allCashboxTransactions,
  });

  await loadRowsViaJSONFile({
    dataset_id: dataSetId,
    table_id: remonlineCashBoxTableId,
    schema: remonlineCashboxesTableSchema,
    rows: cashboxes,
  });

  await loadRowsViaJSONFile({
    dataset_id: dataSetId,
    table_id: cashFlowItemTableId,
    schema: cashFlowItemsTableSchema,
    rows: uniqueCashFlowItems.filter((item) => item.id),
  });
};
async function createOrResetRemonlineTransactionTables() {
  await createOrResetTableByName({
    bqTableId: cashboxTransactionTableId,
    schema: cashboxTransactionsTableSchema,
    dataSetId,
  });
  await createOrResetTableByName({
    bqTableId: cashFlowItemTableId,
    schema: cashFlowItemsTableSchema,
    dataSetId,
  });
  await createOrResetTableByName({
    bqTableId: remonlineCashBoxTableId,
    schema: remonlineCashboxesTableSchema,
    dataSetId,
  });
}

if (process.env.ENV === 'DEV') {
  await remonlineTokenToEnv(true);
  await createOrResetRemonlineTransactionTables();
  await loadRemonlineTransactionsToBQ();
  // await resetUOMTable();
}
