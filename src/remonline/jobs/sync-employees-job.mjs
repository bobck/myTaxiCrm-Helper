import { CronJob } from 'cron';
import { syncRemonlineEmployees } from '../modules/sync-employees.mjs';

const cronTime = '0 2 * * 0';
const timeZone = 'Europe/Kiev';

const syncRemonlineEmployeesJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await syncRemonlineEmployees();
    } catch (e) {
      console.error('An error occurred while syncing Remonline employees.');
      console.error(e);
    }
  },
});

export { syncRemonlineEmployeesJob };
