import { CronJob } from 'cron';
import { moveOrdersToClose } from '../modules/move-order-to-close.mjs';

const cronTime = '20 */2 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await moveOrdersToClose();
    } catch (error) {
      console.error('Error occurred in onTick moveOrdersToCloseJob');
      console.error({
        time: new Date(),
        error,
      });
    }
  },
});

export const moveOrdersToCloseJob = job;
export const startMoveOrdersToCloseJob = () => job.start();
