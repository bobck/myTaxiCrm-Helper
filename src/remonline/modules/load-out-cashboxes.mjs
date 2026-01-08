import { getCashboxes } from '../remonline.utils.mjs';
import { devLog } from '../../shared/shared.utils.mjs';
import * as RemonlinePrisma from '../remonline.prisma.mjs';
import { remonlineTokenToEnv } from '../remonline.api.mjs';
export const loadOutCashboxes = async () => {
  console.log({
    module: 'loadOutCashboxes',
    date: new Date(),
  });

  try {
    // 1. Fetch all cashboxes from Remonline API
    const { cashboxes } = await getCashboxes();

    if (!cashboxes || cashboxes.length === 0) {
      console.log('No cashboxes found.');
      return;
    }

    devLog(`Fetched ${cashboxes.length} cashboxes from API.`);

    // await RemonlinePrisma.upsertCashboxes(cashboxes);
    for (const cashbox of cashboxes) {
      await RemonlinePrisma.upsertCashbox(cashbox)
    }
    console.log('Successfully synced cashboxes to Postgres.');
  } catch (error) {
    console.error('Error in loadOutCashboxes:', error);
  }
};
if (process.env.ENV === 'DEV') {
  await remonlineTokenToEnv(true);
  await loadOutCashboxes();
}
