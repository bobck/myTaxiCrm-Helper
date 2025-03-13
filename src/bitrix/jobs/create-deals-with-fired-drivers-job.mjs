import { CronJob } from 'cron';
import { createDealsWithFiredDrivers } from '../modules/create-deals-with-fired-drivers.mjs';

const cronTime = '*/15 * * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await createDealsWithFiredDrivers();
    } catch (error) {
      console.error('Error occurred in onTick createDealsWithFiredDrivers');
      console.error({
        time: new Date(),
        error,
      });
    }
  },
});

export const createDealsWithFiredDriversJob = job;
export const startcreateDealsWithFiredDriversJob = () => job.start();
