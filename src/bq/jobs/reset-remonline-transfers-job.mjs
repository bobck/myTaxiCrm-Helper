import { CronJob } from 'cron';
import { resetTransfersTables } from '../modules/generate-and-save-remonline-transfers.mjs';

const cronTime = '50 5 3 * *'; // Runs at 5:50 AM on the 3rd day of each month

const timeZone = 'Europe/Kiev';

const resetRemonlineTransfersJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await resetTransfersTables();
    } catch (e) {
      console.error('An error occurred while creating transfers tables');
      console.error(e.errors[0]);
    }
  },
});

export { resetRemonlineTransfersJob };
