import { CronJob } from 'cron';
import { moveNewWorkingDrivers } from '../modules/new-working-drivers.mjs';

const cronTime = '15 6 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await moveNewWorkingDrivers();
    } catch (error) {
      console.error('Error occurred in onTick on moveNewWorkingDrivers');
      console.error({ time: new Date(), error });
    }
  },
});

export const moveNewWorkingDriversJob = job;
