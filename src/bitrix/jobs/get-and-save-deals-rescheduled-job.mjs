import { CronJob } from 'cron';
import { getAndSaveDealsRescheduled } from '../modules/get-and-save-deals-rescheduled.mjs';

const cronTime = '03 0 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await getAndSaveDealsRescheduled();
    } catch (error) {
      console.error('Error occurred in onTick getAndSaveDealsRescheduled');
      console.error({
        time: new Date(),
        error,
      });
    }
  },
});

export const getAndSaveDealsRescheduledJob = job;
