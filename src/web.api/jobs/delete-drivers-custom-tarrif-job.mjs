import { CronJob } from 'cron';
import { deleteDriversCustomTariff } from '../modules/drivers-custom-tariff.mjs';

const cronTime = '0 22 * * 1';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    if (process.env.CUSTOM_TERMS == 'OFF') {
      return;
    }

    try {
      await deleteDriversCustomTariff();
    } catch (error) {
      console.error('Error occurred in onTick deleteDriversCustomTariff');
      console.error({
        time: new Date(),
        error,
      });
    }
  },
});

export const deleteDriversCustomTariffJob = job;
export const startDeleteDriversCustomTariffJob = () => job.start();
