import { CronJob } from 'cron';

import { generateAndSaveTransfers } from '../modules/generate-and-save-remonline-transfers.mjs';

const cronTime = '15 6 3 * *'; // Runs at 6:15 AM on the 3rd day of each month

const timeZone = 'Europe/Kiev';

const loadRemonlineTransfersJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await generateAndSaveTransfers();
    } catch (e) {
      console.error('An error occurred while loading transfers.');
      console.error(e.errors[0]);
    }
  },
});

export { loadRemonlineTransfersJob };
