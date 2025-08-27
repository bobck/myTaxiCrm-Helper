import { CronJob } from 'cron';
import { generateAndSavePolandBookkeepingReport } from '../modules/generate-and-save-poland-bookkeeping-report.mjs';

const cronTime = '0 4 * * 1';

const timeZone = 'Europe/Warsaw';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await generateAndSavePolandBookkeepingReport({
        autoParkId: 'de4bf8ba-30c2-452c-a688-104063052961',
      });
      await generateAndSavePolandBookkeepingReport({
        autoParkId: 'be6ab23a-d6ba-4add-b0f7-cfb8abd0586b',
      });
      await generateAndSavePolandBookkeepingReport({
        autoParkId: '58ea1e9e-ebdd-4c4d-870c-6ef06e868c60',
      });
      await generateAndSavePolandBookkeepingReport({
        autoParkId: '21b543d1-a14a-43c6-a719-5becbd25a4e3',
      });
      await generateAndSavePolandBookkeepingReport({
        autoParkId: '444afd80-52d5-4c87-b02a-c43db8982bef',
      });
    } catch (error) {
      console.error(
        'Error occurred in onTick generateAndSavePolandBookkeepingReport'
      );
      console.error({ time: new Date(), error });
    }
  },
});

export const generateAndSavePolandBookkeepingReportJob = job;
