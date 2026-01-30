import { CronJob } from 'cron';
import { loadOutCashboxTransactions } from '../modules/load-out-cashbox-transactions.mjs';

const cronTime = '5 5 * * *';

const timeZone = 'Europe/Kiev';

export const loadOutCashboxTransactionsJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await loadOutCashboxTransactions();
    } catch (error) {
      console.error('Error occurred in onTick loadOutCashboxTransactionsJob');
      console.error({ time: new Date(), error });
    }
  },
});
