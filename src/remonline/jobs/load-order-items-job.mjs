import { CronJob } from 'cron';
import { loadOrderItems } from '../modules/load-order-items.mjs';

const cronTime = '0 */4 * * *';
const timeZone = 'Europe/Kiev';
let isFunctionRunning = false;

const loadOrderItemsJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    if (isFunctionRunning) {
      console.log('In running loadOrderItems...');
      return;
    }

    try {
      isFunctionRunning = true;
      await loadOrderItems();
    } catch (error) {
      console.error('Error occurred in onTick loadOrderItems');
      console.error({ time: new Date(), error });
    } finally {
      isFunctionRunning = false;
    }
  },
});

export { loadOrderItemsJob };
