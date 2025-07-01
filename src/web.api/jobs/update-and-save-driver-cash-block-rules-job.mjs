import { CronJob } from 'cron';
import {
  setDriverCashBlockRules,
  updateDriverCashBlockRules,
} from '../modules/driver-cash-block-rules.mjs';

const cronTime = '15 8 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await updateDriverCashBlockRules();
      await setDriverCashBlockRules();
    } catch (error) {
      console.error(
        'Error occurred in onTick updateAndSaveDriverCashBlockRules'
      );
      console.error({ time: new Date(), error });
    }
  },
});

export const updateAndSaveDriverCashBlockRulesJob = job;
