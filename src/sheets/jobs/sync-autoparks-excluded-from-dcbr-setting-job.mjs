import { CronJob } from 'cron';
import { synchronizeAutoParksExcludedFromDCBRSetting } from '../modules/sync-autoparks-excluded-from-dcbr-setting.mjs';

const cronTime = '0 3 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await synchronizeAutoParksExcludedFromDCBRSetting();
    } catch (error) {
      console.error(
        'Error occurred in onTick synchronizeAutoParksExcludedFromDCBRSetting'
      );
      console.error({ time: new Date(), error });
    }
  },
});

export const synchronizeAutoParksExcludedFromDCBRSettingJob = job;
