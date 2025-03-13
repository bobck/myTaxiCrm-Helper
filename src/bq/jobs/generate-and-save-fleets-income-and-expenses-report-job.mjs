import { CronJob } from 'cron';
import { generateAndSaveFleetsIncomAndExpensesReport } from '../modules/generate-and-save-fleets-income-and-expenses_report.mjs';

const cronTime = '0 */6 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await generateAndSaveFleetsIncomAndExpensesReport();
    } catch (error) {
      console.error(
        'Error occurred in onTick generateAndSaveFleetsIncomAndExpensesReport'
      );
      console.error({
        time: new Date(),
        error,
      });
    }
  },
});

export const generateAndSaveFleetsIncomAndExpensesReportJob = job;
