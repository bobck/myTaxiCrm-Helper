import { CronJob } from 'cron';
import { syncWarehouses } from '../modules/sync-warehouses.mjs';

const cronTime = '0 4 * * 0';
const timeZone = 'Europe/Kiev';

const syncWarehousesJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await syncWarehouses();
    } catch (e) {
      console.error('An error occurred while syncing Remonline warehouses.');
      console.error(e);
    }
  },
});

export { syncWarehousesJob };
