import { CronJob } from 'cron';
import { loadRemonlineOrdersV2 } from '../modules/load-remonline-orders-v2.mjs';
import { loadRemonlineOrderItems } from '../modules/load-remonline-order-items.mjs';

const cronTime = '0 * * * *'; // Runs every hour
const timeZone = 'Europe/Kiev';

let isRunning = false;

const loadRemonlineOrdersV2Job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    if (isRunning) {
      console.log(
        'loadRemonlineOrdersV2Job: previous tick still running, skip'
      );
      return;
    }
    isRunning = true;
    try {
      await loadRemonlineOrdersV2();
      await loadRemonlineOrderItems();
    } catch (e) {
      console.error('An error occurred while uploading v2 orders');
      console.error(e);
    } finally {
      isRunning = false;
    }
  },
});

export { loadRemonlineOrdersV2Job };
