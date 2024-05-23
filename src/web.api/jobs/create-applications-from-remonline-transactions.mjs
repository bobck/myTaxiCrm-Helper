import { CronJob } from 'cron';
import { createCRMApplicationsFromRemonlineTransaction } from '../modules/applications-from-remonline-transactions.mjs';

const cronTime = '*/30 * * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
    cronTime,
    timeZone,
    onTick: async () => {

        if (process.env.runs_createCRMApplicationsFromRemonlineTransaction == 'TRUE') {
            console.log('createCRMApplicationsFromRemonlineTransaction still in run...')
            return
        }

        try {
            await createCRMApplicationsFromRemonlineTransaction();
        } catch (error) {
            console.error('Error occurred in onTick deleteDriversCustomBonus');
            console.error({ time: new Date(), error });
        }
    }
});

export const createCRMApplicationsFromRemonlineTransactionJob = job;
