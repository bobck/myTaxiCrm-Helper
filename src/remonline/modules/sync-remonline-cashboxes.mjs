import { getCashboxes } from '../remonline.utils.mjs';
import prisma from '../remonline.prisma.mjs';
import { devLog } from '../../shared/shared.utils.mjs';
import { remonlineTokenToEnv } from '../remonline.api.mjs';

export async function syncRemonlineCashboxes() {
  const time = new Date();
  devLog({ time, message: 'syncRemonlineCashboxes' });

  const { cashboxes } = await getCashboxes();

  devLog({ message: `Fetched ${cashboxes.length} cashboxes from Remonline` });

  let upserted = 0;

  for (const cashbox of cashboxes) {
    const { id, title, type, currency, balance, is_global } = cashbox;

    await prisma.cashbox.upsert({
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

  devLog({ message: `Upserted ${upserted} cashboxes` });
}

if (process.env.ENV === 'TEST') {
  devLog('Running syncRemonlineCashboxes in TEST mode...');
  await remonlineTokenToEnv(true);
  await syncRemonlineCashboxes();
}
