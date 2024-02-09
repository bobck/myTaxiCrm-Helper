import { CronJob } from 'cron';
import { deleteDriversCustomTariff } from '../modules/drivers-custom-tariff.mjs'

const cronTime = '0 4 * * 1';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
    cronTime,
    timeZone,
    onTick: async () => {
        try {
            await deleteDriversCustomTariff();
        } catch (error) {
            console.error('Error occurred in onTick deleteDriversCustomTariff');
            console.error({ time: new Date(), error });
        }
    }
});

export const deleteDriversCustomTariffJob = job;
export const startDeleteDriversCustomTariffJob = () => job.start();