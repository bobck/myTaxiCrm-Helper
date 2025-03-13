import { CronJob } from 'cron';
import { generateAndSaveCarsRoutsReport } from '../modules/generate-and-save-cars-routs-report.mjs';

const cronTime = '0,15,30,45 8,9,10,11 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await generateAndSaveCarsRoutsReport();
    } catch (error) {
      console.error('Error occurred in onTick generateAndSaveCarsRoutsReport');
      console.error({ time: new Date(), error });
    }
  },
});

export const generateAndSaveCarsRoutsReportJob = job;
