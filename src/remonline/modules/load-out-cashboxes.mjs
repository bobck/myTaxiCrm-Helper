import { getCashboxes } from '../remonline.utils.mjs';
import { devLog } from '../../shared/shared.utils.mjs';
import * as RemonlinePrisma from '../remonline.prisma.mjs';
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

    // 2. Iterate and sync with Postgres
    for (const cashboxData of cashboxes) {
      await RemonlinePrisma.upsertCashbox(cashboxData);
    }

    console.log('Successfully synced cashboxes to Postgres.');
  } catch (error) {
    console.error('Error in loadOutCashboxes:', error);
  }
};
