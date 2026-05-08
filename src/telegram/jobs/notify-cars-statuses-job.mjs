import { CronJob } from 'cron';
import { notifyCarsStatusChanges } from '../modules/notify-cars-statuses.mjs';

// 08:05 and 12:05, Mon–Fri, Europe/Kiev
const cronTime = '5 8,12 * * 1-5';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await notifyCarsStatusChanges();
    } catch (error) {
      console.error('Error occurred in onTick notifyCarsStatusChanges');
      console.error({ time: new Date(), error });
    }
  },
});

export const notifyCarsStatusesJob = job;
