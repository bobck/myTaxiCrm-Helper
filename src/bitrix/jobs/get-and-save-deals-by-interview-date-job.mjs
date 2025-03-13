import { CronJob } from 'cron';
import { getAndSaveDealsByInterviewDate } from '../modules/get-and-save-deals-by-interview-date.mjs';

const cronTime = '07 0 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await getAndSaveDealsByInterviewDate();
    } catch (error) {
      console.error('Error occurred in onTick getAndSaveDealsByInterviewDate');
      console.error({
        time: new Date(),
        error,
      });
    }
  },
});

export const getAndSaveDealsByInterviewDateJob = job;
