import { CronJob } from 'cron';
import { syncRemonlineCashboxes } from '../modules/sync-remonline-cashboxes.mjs';

const cronTime = '0 */6 * * *';
const timeZone = 'Europe/Kiev';

const syncRemonlineCashboxesJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await syncRemonlineCashboxes();
    } catch (e) {
      console.error('An error occurred while syncing Remonline cashboxes.');
      console.error(e);
    }
  },
});

export { syncRemonlineCashboxesJob };
