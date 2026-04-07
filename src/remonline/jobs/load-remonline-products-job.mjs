import { CronJob } from 'cron';
import { loadRemonlineProducts } from '../modules/load-remonline-products.mjs';

const cronTime = '5 * * * *'; // Run every hour
const timeZone = 'Europe/Kiev';

const loadRemonlineProductsJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await loadRemonlineProducts();
    } catch (e) {
      console.error('An error occurred while loading RemOnline products.');
      console.error(e);
    }
  },
});

export { loadRemonlineProductsJob };
