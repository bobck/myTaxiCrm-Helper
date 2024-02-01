import { CronJob } from 'cron';
import { generateAndSaveDriversWithFuelCardsReport } from '../modules/generate-and-save-drivers-with-fuel-cards.mjs';

const cronTime = '0 8 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
    cronTime,
    timeZone,
    onTick: async () => {
        try {
            await generateAndSaveDriversWithFuelCardsReport();
        } catch (error) {
            console.error('Error occurred in onTick generateAndSaveDriversWithFuelCardsReport');
            console.error({ time: new Date(), error });
        }
    }
});

export const generateAndSaveDriversWithFuelCardsReportJob = job;
