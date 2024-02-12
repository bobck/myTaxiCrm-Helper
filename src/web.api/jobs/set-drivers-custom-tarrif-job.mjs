import { CronJob } from 'cron';
import { setDriversCustomTariff } from '../modules/drivers-custom-tariff.mjs'


const cronTime = '0 23 * * 2-4';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
    cronTime,
    timeZone,
    onTick: async () => {

        if (process.env.CUSTOM_TERMS == 'OFF') {
            return
        }

        try {
            await setDriversCustomTariff();
        } catch (error) {
            console.error('Error occurred in onTick setDriversCustomTariff');
            console.error({ time: new Date(), error });
        }
    }
});

export const setDriversCustomTariffJob = job;
export const startSetDriversCustomTariffJob = () => job.start();