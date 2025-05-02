import { CronJob } from 'cron';
import { loadRemonlineOrders } from '../modules/load-remonline-orders.mjs';

const cronTime = '0 */4 * * *'; // Runs every 4 hours
const timeZone = 'Europe/Kiev';

const loadRemonlineOrdersJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await loadRemonlineOrders();
    } catch (e) {
      console.error('An error occurred while uploading order tables');
      console.error(e);
    }
  },
});

export { loadRemonlineOrdersJob };
