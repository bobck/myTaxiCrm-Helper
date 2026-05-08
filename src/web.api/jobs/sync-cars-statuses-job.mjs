import { CronJob } from 'cron';
import { syncCarsStatuses } from '../modules/sync-cars-statuses.mjs';

const cronTime = '*/5 * * * *';

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
