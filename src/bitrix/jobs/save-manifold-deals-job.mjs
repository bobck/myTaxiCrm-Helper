import { CronJob } from 'cron';
import { refreshManifoldDeals } from '../modules/save-manifold-deals.mjs';

const cronTime = '35 * * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
    cronTime,
    timeZone,
    onTick: async () => {
        try {
            await refreshManifoldDeals();
        } catch (error) {
            console.error('Error occurred in onTick on refreshManifoldDeals');
            console.error({ time: new Date(), error });
        }
    }
});

export const refreshManifoldDealsJob = job;