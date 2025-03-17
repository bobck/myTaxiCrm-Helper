import { CronJob } from 'cron';
import { getAndSaveDtpDebtTransactions } from '../modules/get-and-save-dtp-debt-transactions.mjs';

const cronTime = '*/20 * * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await getAndSaveDtpDebtTransactions();
    } catch (error) {
      console.error(
        'Error occurred in onTick on getAndSaveDtpDebtTransactions'
      );
      console.error({ time: new Date(), error });
    }
  },
});

export const getAndSaveDtpDebtTransactionsJob = job;
