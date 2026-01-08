import { CronJob } from 'cron';
import { loadOutCashboxes } from '../modules/load-out-cashboxes.mjs';

const cronTime = '* 5 * * *';

const timeZone = 'Europe/Kiev';

export const loadOutCashboxesJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await loadOutCashboxes();
    } catch (error) {
      console.error('Error occurred in onTick loadOutCashboxesJob');
      console.error({ time: new Date(), error });
    }
  },
});
