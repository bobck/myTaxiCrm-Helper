import { CronJob } from 'cron';
import { syncAutoParks } from '../modules/sync-auto-parks.mjs';

// 06:00 every Monday, Europe/Kiev
const cronTime = '0 6 * * 1';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await syncAutoParks();
    } catch (error) {
      console.error('Error occurred in onTick syncAutoParks');
      console.error({ time: new Date(), error });
    }
  },
});

export const syncAutoParksJob = job;
