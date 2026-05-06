import { CronJob } from 'cron';
import { syncRemonlineAssets } from '../modules/sync-assets.mjs';

const cronTime = '0 2 * * 0';
const timeZone = 'Europe/Kiev';

const syncRemonlineAssetsJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await syncRemonlineAssets();
    } catch (e) {
      console.error('An error occurred while syncing Remonline assets.');
      console.error(e);
    }
  },
});

export { syncRemonlineAssetsJob };
