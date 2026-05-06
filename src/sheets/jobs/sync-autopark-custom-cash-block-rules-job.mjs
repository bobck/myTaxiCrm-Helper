import { CronJob } from 'cron';
import { synchronizeAutoParkCustomCashBlockRules } from '../modules/sync-autopark-custom-cash-block-rules.mjs';

const cronTime = '0 3 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await synchronizeAutoParkCustomCashBlockRules();
    } catch (error) {
      console.error(
        'Error occurred in onTick synchronizeAutoParksExcludedFromDCBRSetting'
      );
      console.error({ time: new Date(), error });
    }
  },
});

export const synchronizeAutoParkCustomCashBlockRulesJob = job;
