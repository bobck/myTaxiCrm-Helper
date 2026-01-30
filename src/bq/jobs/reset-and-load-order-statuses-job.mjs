import { CronJob } from 'cron';
import {
  resetOrderStatusesTable,
  loadOrderStatusesToBQ,
} from '../modules/load-order-statuses.mjs';

// Run at 2:00 AM on the 1st of every month
const cronTime = '0 2 1 * *';

const timeZone = 'Europe/Kiev';

const resetAndLoadOrderStatusesJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      console.log({
        time: new Date(),
        message: 'Starting monthly order statuses reset and load job',
      });
      await resetOrderStatusesTable();
      await loadOrderStatusesToBQ();
      console.log({
        time: new Date(),
        message: 'Completed monthly order statuses reset and load job',
      });
    } catch (e) {
      console.error(
        'An error occurred while resetting and loading order statuses'
      );
      console.error(e);
    }
  },
});

export { resetAndLoadOrderStatusesJob };
