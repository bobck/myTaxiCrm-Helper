import { CronJob } from 'cron';
import { createBoltDriversToBan } from "../modules/create-bolt-drivers-to-ban.mjs";

const cronTime = '';

const timeZone = 'Europe/Kiev';

const createBoltDriverBanRequestsJob = CronJob.from({
    cronTime,
    timeZone,
    onTick: async () => {
        try {
            await createBoltDriversToBan();
        } catch (error) {
            console.error('Error occurred in onTick createDealsWithFiredDrivers');
            console.error({ time: new Date(), error });
        }
    }
});

export { createBoltDriverBanRequestsJob };
