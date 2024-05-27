import { CronJob } from 'cron';
import { createCRMApplicationsFromRemonlineTransaction } from '../modules/applications-from-remonline-transactions.mjs';

const cronTime = '*/30 * * * *';

const timeZone = 'Europe/Kiev';
let isFunctionRunning = false;

const job = CronJob.from({
    cronTime,
    timeZone,
    onTick: async () => {
        if (isFunctionRunning) {
            console.log('In running createCRMApplicationsFromRemonlineTransaction...');
            return;
        }

        try {
            isFunctionRunning = true;
            await createCRMApplicationsFromRemonlineTransaction();
        } catch (error) {
            console.error('Error occurred in onTick createCRMApplicationsFromRemonlineTransaction');
            console.error({ time: new Date(), error });
        } finally {
            isFunctionRunning = false;
        }
    }
});

export const createCRMApplicationsFromRemonlineTransactionJob = job;
