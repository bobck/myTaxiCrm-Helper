import { CronJob } from 'cron';
import { loadRemonlineCashboxTransactions } from '../modules/load-remonline-cashbox-transactions.mjs';

const cronTime = '*/30 * * * *';
const timeZone = 'Europe/Kiev';
let isFunctionRunning = false;

const loadRemonlineCashboxTransactionsJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    if (isFunctionRunning) {
      console.log('In running loadRemonlineCashboxTransactions...');
      return;
    }

    try {
      isFunctionRunning = true;
      await loadRemonlineCashboxTransactions();
    } catch (error) {
      console.error(
        'Error occurred in onTick loadRemonlineCashboxTransactions'
      );
      console.error({ time: new Date(), error });
    } finally {
      isFunctionRunning = false;
    }
  },
});

export { loadRemonlineCashboxTransactionsJob };
