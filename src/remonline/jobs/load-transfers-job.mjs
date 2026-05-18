import { CronJob } from 'cron';
import { loadTransfers } from '../modules/load-transfers.mjs';

const cronTime = '0 */4 * * *'; // Every 4 hours, mirrors orders/items cadence
const timeZone = 'Europe/Kiev';
let isFunctionRunning = false;

const loadTransfersJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    if (isFunctionRunning) {
      console.log('In running loadTransfers...');
      return;
    }

    try {
      isFunctionRunning = true;
      await loadTransfers();
    } catch (error) {
      console.error('Error occurred in onTick loadTransfers');
      console.error({ time: new Date(), error });
    } finally {
      isFunctionRunning = false;
    }
  },
});

export { loadTransfersJob };
