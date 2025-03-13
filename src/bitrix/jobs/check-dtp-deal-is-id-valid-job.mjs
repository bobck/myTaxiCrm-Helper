import { CronJob } from 'cron';
import { checkDtpDealIdIsValid } from '../modules/check-dtp-deal-is-id-valid.mjs';

const cronTime = '*/22 * * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await checkDtpDealIdIsValid();
    } catch (error) {
      console.error('Error occurred in onTick on checkDtpDealIdIsValid');
      console.error({
        time: new Date(),
        error,
      });
    }
  },
});

export const checkDtpDealIdIsValidJob = job;
