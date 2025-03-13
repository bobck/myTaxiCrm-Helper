import { CronJob } from 'cron';
import { getAndSaveLeadsByCreatedDate } from '../modules/get-and-save-leads-by-created-date.mjs';

const cronTime = '01 0 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await getAndSaveLeadsByCreatedDate();
    } catch (error) {
      console.error('Error occurred in onTick getAndSaveLeadsByCreatedDate');
      console.error({ time: new Date(), error });
    }
  },
});

export const getAndSaveLeadsByCreatedDateJob = job;
