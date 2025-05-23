import { CronJob } from 'cron';
import { resetUOMTable } from '../modules/load-remonline-uoms.mjs';
import { resetAssetTable } from '../modules/load-remonline-assets.mjs';
import { resetEmployeeTable } from '../modules/load-remonline-employees.mjs';
const cronTime = '55 1 * * 0'; // Run at 2:00 AM every Sunday night (which is technically early Monday morning)

const timeZone = 'Europe/Kiev';

const resetSecondaryRemonlineTablesJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await resetUOMTable();
      await resetAssetTable();
      await resetEmployeeTable();
    } catch (e) {
      console.error(
        'An error occurred while resetting secondary tables job tables'
      );
      console.error(e);
    }
  },
});

export { resetSecondaryRemonlineTablesJob };
