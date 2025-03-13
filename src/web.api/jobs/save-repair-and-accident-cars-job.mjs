import { CronJob } from 'cron';
import { saveRepairAndAccidentCarsReport } from '../modules/save-repair-and-accident-cars.mjs';

const cronTime = '9 0 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await saveRepairAndAccidentCarsReport();
    } catch (error) {
      console.error('Error occurred in onTick saveRepairAndAccidentCarsReport');
      console.error({
        time: new Date(),
        error,
      });
    }
  },
});

export const saveRepairAndAccidentCarsReportJob = job;
