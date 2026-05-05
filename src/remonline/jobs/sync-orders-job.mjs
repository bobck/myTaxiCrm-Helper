import { CronJob } from 'cron';
import { syncRemonlineOrders } from '../modules/sync-orders.mjs';

const cronTime = '0 2 * * 0';
const timeZone = 'Europe/Kiev';

const syncRemonlineOrdersJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await syncRemonlineOrders();
    } catch (e) {
      console.error('An error occurred while syncing Remonline orders.');
      console.error(e);
    }
  },
});

export { syncRemonlineOrdersJob };
