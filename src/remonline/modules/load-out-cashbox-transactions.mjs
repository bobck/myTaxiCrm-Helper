import { getCashboxTransactions } from '../remonline.utils.mjs';
import * as RemonlinePrisma from '../remonline.prisma.mjs';
import { devLog } from '../../shared/shared.utils.mjs';
import { remonlineTokenToEnv } from '../remonline.api.mjs';

export const loadOutCashboxTransactions = async () => {
  console.log({
    module: 'loadOutCashboxTransactions',
    date: new Date(),
  });

  try {
    // 1. Get all cashboxes
    const cashboxes = await RemonlinePrisma.getAllCashboxes();

    if (!cashboxes || cashboxes.length === 0) {
      console.log('No cashboxes found in DB to sync transactions for.');
      return;
    }

    // 2. Iterate through each cashbox
    for (const cashbox of cashboxes) {
      const cashboxId = cashbox.id; // Now Int

      // DYNAMIC: Fetch the last known transaction timestamp from the DB
      const lastCreatedAt =
        await RemonlinePrisma.getLastTransactionCreatedAt(cashboxId);

      // Calculate 'createdAt' filter (Last timestamp + 1s/1000ms)
      const startFrom = lastCreatedAt ? Number(lastCreatedAt) + 1000 : null;

      devLog(
        `Fetching transactions for Cashbox ${cashboxId} starting from ${startFrom || 'Beginning'}`
      );

      // 3. Fetch transactions from API
      const { transactions } = await getCashboxTransactions({
        cashboxId,
        createdAt: startFrom,
      });

      if (!transactions || transactions.length === 0) {
        devLog(`No new transactions for cashbox ${cashboxId}`);
        continue;
      }

      devLog(`Fetched ${transactions.length} new transactions.`);

      // 4. Extract and Deduplicate CashFlow Items
      const uniqueCashFlowItems = new Map();
      const mappedTransactions = [];

      for (const t of transactions) {
        if (t.cashflow_item && t.cashflow_item.id) {
          uniqueCashFlowItems.set(t.cashflow_item.id, t.cashflow_item);
        }

        const relatedDoc = t.related_document || {};

        mappedTransactions.push({
          id: t.id,
          cashboxId: cashboxId, // Int, matching new schema field name
          value: t.value,
          direction: t.direction,
          employeeId: t.employee_id,
          createdAt: BigInt(t.created_at),
          description: t.description || '',
          clientId: t.client_id || null,
          relatedDocumentId: relatedDoc.id || null,
          relatedDocumentType: relatedDoc.type || null,
          cashflowItemId: t.cashflow_item ? t.cashflow_item.id : null,
        });
      }

      // 5. Sync Data
      if (uniqueCashFlowItems.size > 0) {
        await RemonlinePrisma.upsertCashFlowItems(
          Array.from(uniqueCashFlowItems.values())
        );
      }

      await RemonlinePrisma.createCashboxTransactions(mappedTransactions);

      console.log(
        `Synced ${mappedTransactions.length} transactions for Cashbox ${cashboxId}`
      );
    }

    console.log('Successfully synced all transactions.');
  } catch (error) {
    console.error('Error in loadOutRemonlineTransactions:', error);
  }
};
if (process.env.ENV === 'DEV') {
  await remonlineTokenToEnv(true);
  await loadOutCashboxTransactions();
}
