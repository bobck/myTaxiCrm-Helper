import { CronJob } from 'cron';
import { syncOrderStatuses } from '../modules/sync-order-statuses.mjs';

const cronTime = '0 3 1 * *';
const timeZone = 'Europe/Kiev';

const syncOrderStatusesJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await syncOrderStatuses();
    } catch (e) {
      console.error('An error occurred while syncing Remonline order statuses.');
      console.error(e);
    }
  },
});

export { syncOrderStatusesJob };
