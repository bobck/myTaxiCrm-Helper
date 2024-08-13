import { CronJob } from 'cron';
import { generateAndSavePolandBookkeepingReport } from '../modules/generate-and-save-poland-bookkeeping-report.mjs';

const cronTime = '0 4 * * 1';

const timeZone = 'Europe/Warsaw';

const job = CronJob.from({
    cronTime,
    timeZone,
    onTick: async () => {
        try {
            await generateAndSavePolandBookkeepingReport();
        } catch (error) {
            console.error('Error occurred in onTick generateAndSavePolandBookkeepingReport');
            console.error({ time: new Date(), error });
        }
    }
});

export const generateAndSavePolandBookkeepingReportJob = job;
