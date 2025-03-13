import { CronJob } from 'cron';
import { accrueDebtToDeal } from '../modules/accrue-debt-to-deal.mjs';

const cronTime = '*/30 * * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await accrueDebtToDeal();
    } catch (error) {
      console.error('Error occurred in onTick on accrueDebtToDeal');
      console.error({
        time: new Date(),
        error,
      });
    }
  },
});

export const accrueDebtToDealJob = job;
