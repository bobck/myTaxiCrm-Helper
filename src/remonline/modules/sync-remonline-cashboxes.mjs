import { getCashboxes } from '../remonline.utils.mjs';
import prisma from '../remonline.prisma.mjs';
import { devLog } from '../../shared/shared.utils.mjs';
import { remonlineTokenToEnv } from '../remonline.api.mjs';

export async function syncRemonlineCashboxes() {
  const time = new Date();
  devLog({ time, message: 'syncRemonlineCashboxes' });

  const { cashboxes } = await getCashboxes();

  devLog({ message: `Fetched ${cashboxes.length} cashboxes from Remonline` });

  const remoteIds = cashboxes.map((cashbox) => cashbox.id);

  const { upserted, disabledCount } = await prisma.$transaction(
    async (tx) => {
      let upserted = 0;

      for (const cashbox of cashboxes) {
        const { id, title, type, currency, balance, is_global } = cashbox;

        await tx.cashbox.upsert({
          where: { id },
          create: {
            id,
            title,
            type,
            currencyName: currency?.name,
            currencyCode: currency?.code,
            balance,
            isGlobal: is_global,
            isEnabled: true,
          },
          update: {
            title,
            type,
            currencyName: currency?.name,
            currencyCode: currency?.code,
            balance,
            isGlobal: is_global,
          },
        });

        upserted++;
      }

      const disabled = await tx.cashbox.updateMany({
        where: { id: { notIn: remoteIds }, isEnabled: true },
        data: { isEnabled: false },
      });

      return { upserted, disabledCount: disabled.count };
    },
    {
      maxWait: 5000,
      timeout: 60000,
    }
  );

  devLog({
    message: `Upserted ${upserted} cashboxes, disabled ${disabledCount} stale cashboxes`,
  });
}

if (process.env.ENV === 'TEST') {
  devLog('Running syncRemonlineCashboxes in TEST mode...');
  await remonlineTokenToEnv(true);
  await syncRemonlineCashboxes();
}
