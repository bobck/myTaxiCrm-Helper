import { CronJob } from 'cron';
import { updateDriversCustomNotFoundBonus } from '../modules/drivers-custom-bonus.mjs';

const cronTime = '30,50 22 * * 1';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    if (process.env.CUSTOM_TERMS == 'OFF') {
      return;
    }

    try {
      await updateDriversCustomNotFoundBonus();
    } catch (error) {
      console.error(
        'Error occurred in onTick updateDriversCustomNotFoundBonus'
      );
      console.error({ time: new Date(), error });
    }
  },
});

export const updateDriversCustomNotFoundBonusJob = job;
