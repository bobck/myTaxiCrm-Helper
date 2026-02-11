import { CronJob } from 'cron';
import { runRemonlineProductCellsJob } from '../modules/remonline-product-cells.mjs';

const cronTime = '30 3 * * *'; // Runs every day at 3:30 AM
const timeZone = 'Europe/Kiev';

export const remonlineProductCellsJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await runRemonlineProductCellsJob();
    } catch (error) {
      console.error(
        '[RemonlineProductCells] Unhandled error in remonlineProductCellsJob onTick',
        {
          time: new Date().toISOString(),
          error,
        },
      );
    }
  },
});

// Simple manual trigger for testing
if (process.env.ENV === 'TEST') {
  remonlineProductCellsJob.fireOnTick();
}

