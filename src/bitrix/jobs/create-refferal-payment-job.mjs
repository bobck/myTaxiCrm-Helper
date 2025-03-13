import { CronJob } from 'cron';
import { createRefferalPayment } from '../modules/create-refferal-payment.mjs';

const cronTime = '0 10 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await createRefferalPayment();
    } catch (error) {
      console.error('Error occurred in onTick on createRefferalPayment');
      console.error({
        time: new Date(),
        error,
      });
    }
  },
});

export const createRefferalPaymentJob = job;
