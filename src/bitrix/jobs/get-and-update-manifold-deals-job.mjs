import { CronJob } from 'cron';
import {
    saveNewManifoldDeals,
    updateManifoldDealsWithAncidentData,
    updateManifoldDealsWithContactId,
    updateManifoldDealsWithPhone
} from '../modules/get-and-update-manifold-deals.mjs';

const cronTime = '25 * * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
    cronTime,
    timeZone,
    onTick: async () => {
        try {
            await saveNewManifoldDeals();
            await updateManifoldDealsWithAncidentData();
            await updateManifoldDealsWithContactId();
            await updateManifoldDealsWithPhone();
        } catch (error) {
            console.error('Error occurred in onTick on some Manifold function');
            console.error({ time: new Date(), error });
        }
    }
});

export const getAndUpdateManifoldDealsJob = job;