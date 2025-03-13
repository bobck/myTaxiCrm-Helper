import { CronJob } from 'cron';
import { saveFiredByDriversLogs } from '../modules/save-fired-by-drivers-logs.mjs';

const cronTime = '17 0 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await saveFiredByDriversLogs();
    } catch (error) {
      console.error('Error occurred in onTick saveFiredByDriversLogs');
      console.error({ time: new Date(), error });
    }
  },
});

export const saveFiredByDriversLogsJob = job;
