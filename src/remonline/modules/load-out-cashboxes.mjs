import { getCashboxes } from '../remonline.utils.mjs';
import { devLog } from '../../shared/shared.utils.mjs';

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
      const { id, type, currency, balance, is_global, title } = cashboxData;

      const idString = String(id);

      // 3. Upsert into Cashbox table
     
    }

    console.log('Successfully synced cashboxes to Postgres.');
  } catch (error) {
    console.error('Error in loadOutCashboxes:', error);
  }
};
