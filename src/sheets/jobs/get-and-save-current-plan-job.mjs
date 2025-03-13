import { CronJob } from 'cron';
import { getAndSaveCurrentPlan } from '../modules/get-and-save-current-plan.mjs';

// const cronTime = '* * * * *';
const cronTime = '0 8 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await getAndSaveCurrentPlan();
    } catch (error) {
      console.error('Error occurred in onTick getAndSaveCurrentPlan');
      console.error({
        time: new Date(),
        error,
      });
    }
  },
});

export const getAndSaveCurrentPlanJob = job;
export const startGetAndSaveCurrentPlanJob = () => job.start();
