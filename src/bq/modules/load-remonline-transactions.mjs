import { remonlineTokenToEnv } from '../../remonline/remonline.api.mjs';
import {
  createCashflowItem,
  getCaboxesWithCrmMapping,
  markCashboxAsSynchronizedWithBQ,
} from '../../remonline/remonline.queries.mjs';
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
export const loadRemonlineTransactionsToBQ = async ({
  cashboxes,
  cashFlowItems,
  cashboxTransactions,
}) => {
  console.log({
    module: 'loadRemonlineTransactionsToBQ',
    date: new Date(),
  });

  devLog({
    allCashboxTransactionExample: cashboxTransactions[0],
    uniqueCashFlowItemExample: cashFlowItems[0],
    allCashboxTransactions: cashboxTransactions.length,
    uniqueCashFlowItems: cashFlowItems.length,
  });

  await loadRowsViaJSONFile({
    dataset_id: dataSetId,
    table_id: cashboxTransactionTableId,
    schema: cashboxTransactionsTableSchema,
    rows: cashboxTransactions,
  });
  devLog(`loaded ${cashboxTransactions.length} trasactions [v]`);
  await loadRowsViaJSONFile({
    dataset_id: dataSetId,
    table_id: remonlineCashBoxTableId,
    schema: remonlineCashboxesTableSchema,
    rows: cashboxes,
  });

  devLog(`loaded ${cashboxes.length} cashboxes [v]`);
  await markCashboxAsSynchronizedWithBQ({
    remonlineCashboxIds: cashboxes.map((c) => c.id),
  });
  devLog(`marked ${cashboxes.length} cashboxes as sync [v]`);

  await loadRowsViaJSONFile({
    dataset_id: dataSetId,
    table_id: cashFlowItemTableId,
    schema: cashFlowItemsTableSchema,
    rows: cashFlowItems,
  });

  devLog(`loaded ${cashFlowItems.length} cashFlowItems [v]`);
  for (const item of cashFlowItems) {
    await createCashflowItem(item);
  }

  devLog(`marked ${cashFlowItems.length} cashFlowItems as sync [v]`);
};
export async function createOrResetRemonlineTransactionTables() {
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

// if (process.env.ENV === 'DEV') {
//   await remonlineTokenToEnv(true);
//   await createOrResetRemonlineTransactionTables();
//   await loadRemonlineTransactionsToBQ();
//   // await resetUOMTable();
// }
