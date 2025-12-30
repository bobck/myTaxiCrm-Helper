import { CronJob } from 'cron';
import { loadRemonlineOrdersAndSynchronizeProductPrices } from '../modules/load-remonline-orders.mjs';

const cronTime = '0 */2 * * *'; 
const timeZone = 'Europe/Kiev';

const loadRemonlineOrdersJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await loadRemonlineOrdersAndSynchronizeProductPrices();
    } catch (e) {
      console.error('An error occurred while uploading order tables');
      console.error(e);
    }
  },
});

export { loadRemonlineOrdersJob };
