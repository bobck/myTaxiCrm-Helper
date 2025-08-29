import { CronJob } from 'cron';

const cronTime = '0 3 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await synchronizeAutoParksExcludedFromDCBRSetting();
    } catch (error) {
      console.error('Error occurred in onTick synchronizeDriversIgnoringDCBR');
      console.error({ time: new Date(), error });
    }
  },
});

export const synchronizeAutoParksExcludedFromDCBRSettingJob = job;
