import { CronJob } from 'cron';
import { syncRevenueToDeals } from '../modules/sync-drivers-revenue-to-deal.mjs';

const cronTime = '*/10 * * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
    cronTime,
    timeZone,
    onTick: async () => {
        try {
            await syncRevenueToDeals();
        } catch (error) {
            console.error('Error occurred in onTick syncRevenueToDeals');
            console.error({ time: new Date(), error });
        }
    }
});

export const syncRevenueToDealsJob = job;
