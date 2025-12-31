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
export const loadRemonlineTransactionsToBQ = async ({
  cashboxes,
  uniqueCashFlowItems,
  allCashboxTransactions,
}) => {
  console.log({
    module: 'loadRemonlineTransactionsToBQ',
    date: new Date(),
  });

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
