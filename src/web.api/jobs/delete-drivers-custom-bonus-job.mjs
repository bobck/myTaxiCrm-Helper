import { CronJob } from 'cron';
import { deleteDriversCustomBonus } from '../modules/drivers-custom-bonus.mjs'

const cronTime = '20 4 * * 1';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
    cronTime,
    timeZone,
    onTick: async () => {
        try {
            await deleteDriversCustomBonus();
        } catch (error) {
            console.error('Error occurred in onTick deleteDriversCustomBonus');
            console.error({ time: new Date(), error });
        }
    }
});

export const deleteDriversCustomBonusJob = job;
export const startDeleteDriversCustomBonusJob = () => job.start();