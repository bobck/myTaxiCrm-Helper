import { CronJob } from 'cron';
import { syncRemonlineUOMs } from '../modules/sync-uoms.mjs';

const cronTime = '0 2 * * 0';
const timeZone = 'Europe/Kiev';

const syncRemonlineUOMsJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await syncRemonlineUOMs();
    } catch (e) {
      console.error('An error occurred while syncing Remonline UOMs.');
      console.error(e);
    }
  },
});

export { syncRemonlineUOMsJob };
