import { getCashboxTransactions } from '../remonline.utils.mjs';
import prisma from '../remonline.prisma.mjs';
import { devLog } from '../../shared/shared.utils.mjs';
import { remonlineTokenToEnv } from '../remonline.api.mjs';

function mapTransaction(transaction, cashboxId) {
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

  return {
    id,
    cashboxId,
    value,
    direction,
    employeeId: employee_id ?? null,
    createdAt: created_at,
    description: description ?? null,
    clientId: client_id ?? null,
    relatedDocumentId: related_document?.id ?? null,
    relatedDocumentType: related_document?.type ?? null,
    cashflowItemId: cashflow_item?.id ?? null,
    cashflowItemName: cashflow_item?.name ?? null,
    cashflowItemDirection: cashflow_item?.direction ?? null,
  };
}

export async function loadRemonlineCashboxTransactions() {
  const time = new Date();
  devLog({ time, message: 'loadRemonlineCashboxTransactions' });

  const cashboxes = await prisma.cashbox.findMany({
    where: { isEnabled: true },
  });

  devLog({ message: `Found ${cashboxes.length} enabled cashboxes` });

  for (const cashbox of cashboxes) {
    const { id: cashboxId, lastTransactionCreatedAt, title } = cashbox;

    try {
      const createdAt =
        lastTransactionCreatedAt == null
          ? null
          : Number(lastTransactionCreatedAt) + 1000;

      const { transactions } = await getCashboxTransactions({
        cashboxId,
        createdAt,
      });

      if (transactions.length === 0) {
        devLog({
          message: `No new transactions for cashbox ${cashboxId} (${title})`,
        });
        continue;
      }

      const rows = transactions.map((tx) => mapTransaction(tx, cashboxId));

      await prisma.$transaction(
        async (tx) => {
          await tx.cashboxTransaction.createMany({
            data: rows,
            skipDuplicates: true,
          });
        },
        {
          maxWait: 5000,
          timeout: 20000,
        }
      );

      const maxCreatedAt = transactions.reduce(
        (max, tx) => (tx.created_at > max ? tx.created_at : max),
        0
      );

      await prisma.cashbox.update({
        where: { id: cashboxId },
        data: { lastTransactionCreatedAt: maxCreatedAt },
      });

      devLog({
        message: `Loaded ${transactions.length} transactions for cashbox ${cashboxId} (${title})`,
        maxCreatedAt,
      });
    } catch (e) {
      console.error({
        module: 'loadRemonlineCashboxTransactions',
        date: new Date(),
        cashboxId,
        title,
        error: e?.message || e,
      });
    }
  }
}

if (process.env.ENV === 'TEST') {
  devLog('Running loadRemonlineCashboxTransactions in TEST mode...');
  await remonlineTokenToEnv(true);
  await loadRemonlineCashboxTransactions();
}
