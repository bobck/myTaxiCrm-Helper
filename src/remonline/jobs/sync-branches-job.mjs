import { CronJob } from 'cron';
import { syncBranches } from '../modules/sync-branches.mjs';

const cronTime = '0 2 * * 0'; // Sundays at 02:00 — same cadence as UOMs/employees/assets
const timeZone = 'Europe/Kiev';

const syncBranchesJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await syncBranches();
    } catch (e) {
      console.error('An error occurred while syncing branches.');
      console.error(e);
    }
  },
});

export { syncBranchesJob };
