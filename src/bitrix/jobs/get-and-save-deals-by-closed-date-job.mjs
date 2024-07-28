import { CronJob } from 'cron';
import { getAndSaveDealsByClosedDate } from '../modules/get-and-save-deals-by-closed-date.mjs';

const cronTime = '05 0 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
    cronTime,
    timeZone,
    onTick: async () => {
        try {
            await getAndSaveDealsByClosedDate();
        } catch (error) {
            console.error('Error occurred in onTick getAndSaveDealsByClosedDate');
            console.error({ time: new Date(), error });
        }
    }
});

export const getAndSaveDealsByClosedDateJob = job;