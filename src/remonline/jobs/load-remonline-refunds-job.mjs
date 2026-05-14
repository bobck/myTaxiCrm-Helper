import { CronJob } from 'cron';
import { loadRemonlineRefunds } from '../modules/load-remonline-refunds.mjs';

const cronTime = '0 2 * * *';
const timeZone = 'Europe/Kiev';
let isFunctionRunning = false;

const loadRemonlineRefundsJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    if (isFunctionRunning) {
      console.log('In running loadRemonlineRefunds...');
      return;
    }

    try {
      isFunctionRunning = true;
      await loadRemonlineRefunds();
    } catch (error) {
      console.error('Error occurred in onTick loadRemonlineRefunds');
      console.error({ time: new Date(), error });
    } finally {
      isFunctionRunning = false;
    }
  },
});

export { loadRemonlineRefundsJob };
