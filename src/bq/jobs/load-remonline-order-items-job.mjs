import { CronJob } from 'cron';
import { loadRemonlineOrderItems } from '../modules/load-remonline-order-items.mjs';

const cronTime = '5 */4 * * *'; // Runs every 4 hours, in parallel with orders-v2
const timeZone = 'Europe/Kiev';

const loadRemonlineOrderItemsJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await loadRemonlineOrderItems();
    } catch (e) {
      console.error('An error occurred while uploading order items');
      console.error(e);
    }
  },
});

export { loadRemonlineOrderItemsJob };
