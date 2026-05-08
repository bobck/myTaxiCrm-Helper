import { CronJob } from 'cron';
import { syncCarsStatuses } from '../modules/sync-cars-statuses.mjs';

// 08:00 and 12:00, Mon–Fri, Europe/Kiev
const cronTime = '0 8,12 * * 1-5';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await syncCarsStatuses();
    } catch (error) {
      console.error('Error occurred in onTick syncCarsStatuses');
      console.error({ time: new Date(), error });
    }
  },
});

export const syncCarsStatusesJob = job;
