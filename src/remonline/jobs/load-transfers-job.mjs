import { CronJob } from 'cron';
import { loadTransfers } from '../modules/load-transfers.mjs';

const cronTime = '0 */4 * * *';
const timeZone = 'Europe/Kiev';

const loadTransfersJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await loadTransfers();
    } catch (error) {
      console.error('Error occurred in onTick loadTransfers');
      console.error({ time: new Date(), error });
    }
  },
});

export { loadTransfersJob };
