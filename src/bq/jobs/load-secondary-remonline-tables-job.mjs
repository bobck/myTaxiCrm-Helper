import { CronJob } from 'cron';
import { loadRemonlineUOMsToBQ } from '../modules/load-remonline-uoms.mjs';
import { loadRemonlineAssetsToBQ } from '../modules/load-remonline-assets.mjs';
import { loadRemonlineEmployeesToBQ } from '../modules/load-remonline-employees.mjs';
const cronTime = '0 2 * * 0'; // Run at 2:00 AM every Sunday night (which is technically early Monday morning)

const timeZone = 'Europe/Kiev';

const loadSecondaryRemonlineTablesJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await loadRemonlineAssetsToBQ();
      await loadRemonlineEmployeesToBQ();
      await loadRemonlineUOMsToBQ();
    } catch (e) {
      console.error(
        'An error occurred while loading secondary tables job tables'
      );
      console.error(e);
    }
  },
});

export { loadSecondaryRemonlineTablesJob };
