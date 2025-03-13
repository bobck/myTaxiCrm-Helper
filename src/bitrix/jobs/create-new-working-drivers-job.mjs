import { CronJob } from 'cron';
import { saveNewWorkingDrivers } from '../modules/new-working-drivers.mjs';

const cronTime = '0 6 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await saveNewWorkingDrivers();
    } catch (error) {
      console.error('Error occurred in onTick on saveNewWorkingDrivers');
      console.error({
        time: new Date(),
        error,
      });
    }
  },
});

export const saveNewWorkingDriversJob = job;
