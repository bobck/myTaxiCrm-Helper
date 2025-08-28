import { CronJob } from 'cron';
import { synchronizeDriversIgnoringDCBR } from '../modules/sync-drivers-ignoring-dcbr.mjs';

const cronTime = '0 3 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await synchronizeDriversIgnoringDCBR();
    } catch (error) {
      console.error('Error occurred in onTick synchronizeDriversIgnoringDCBR');
      console.error({ time: new Date(), error });
    }
  },
});

export const synchronizeDriversIgnoringDCBRJob = job;
