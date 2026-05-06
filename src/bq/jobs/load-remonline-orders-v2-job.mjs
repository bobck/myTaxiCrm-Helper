import { CronJob } from 'cron';
import { loadRemonlineOrdersV2 } from '../modules/load-remonline-orders-v2.mjs';

const cronTime = '0 */4 * * *'; // Runs every 4 hours
const timeZone = 'Europe/Kiev';

const loadRemonlineOrdersV2Job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await loadRemonlineOrdersV2();
    } catch (e) {
      console.error('An error occurred while uploading v2 orders');
      console.error(e);
    }
  },
});

export { loadRemonlineOrdersV2Job };
