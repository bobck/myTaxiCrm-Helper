import { CronJob } from 'cron';
import { loadOrdersV2 } from '../modules/load-orders-v2.mjs';

const cronTime = '0 */4 * * *';
const timeZone = 'Europe/Kiev';
let isFunctionRunning = false;

const loadOrdersV2Job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    if (isFunctionRunning) {
      console.log('In running loadOrdersV2...');
      return;
    }

    try {
      isFunctionRunning = true;
      await loadOrdersV2();
    } catch (error) {
      console.error('Error occurred in onTick loadOrdersV2');
      console.error({ time: new Date(), error });
    } finally {
      isFunctionRunning = false;
    }
  },
});

export { loadOrdersV2Job };
