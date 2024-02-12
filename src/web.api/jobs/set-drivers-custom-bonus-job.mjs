import { CronJob } from 'cron';
import { setDriversCustomBonus } from '../modules/drivers-custom-bonus.mjs'


const cronTime = '20 23 * * 2-4';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
    cronTime,
    timeZone,
    onTick: async () => {
        try {
            await setDriversCustomBonus();
        } catch (error) {
            console.error('Error occurred in onTick setDriversCustomBonus');
            console.error({ time: new Date(), error });
        }
    }
});

export const setDriversCustomBonusJob = job;
export const startsetDriversCustomBonusJob = () => job.start();