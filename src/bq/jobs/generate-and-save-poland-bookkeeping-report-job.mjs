import { CronJob } from 'cron';
import { generateAndSavePolandBookkeepingReport } from '../modules/generate-and-save-poland-bookkeeping-report.mjs';

const cronTime = '0 4 * * 1';

const timeZone = 'Europe/Warsaw';

const job = CronJob.from({
    cronTime,
    timeZone,
    onTick: async () => {
        try {
            generateAndSavePolandBookkeepingReport({ autoParkId: 'de4bf8ba-30c2-452c-a688-104063052961' })
            generateAndSavePolandBookkeepingReport({ autoParkId: 'be6ab23a-d6ba-4add-b0f7-cfb8abd0586b' })
        } catch (error) {
            console.error('Error occurred in onTick generateAndSavePolandBookkeepingReport');
            console.error({ time: new Date(), error });
        }
    }
});

export const generateAndSavePolandBookkeepingReportJob = job;
