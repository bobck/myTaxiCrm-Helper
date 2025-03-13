import { CronJob } from 'cron';
import {
  moveReferralToClosed,
  moveReferralProcentageRewardToClosed,
} from '../modules/move-referral-to-closed.mjs';

const cronTime = '10 10 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await moveReferralToClosed();
      await moveReferralProcentageRewardToClosed();
    } catch (error) {
      console.error('Error occurred in onTick on moveReferralToClosed');
      console.error({
        time: new Date(),
        error,
      });
    }
  },
});

export const moveReferralToClosedJob = job;
