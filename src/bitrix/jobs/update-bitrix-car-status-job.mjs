import { CronJob } from 'cron';
import { updateBitrixCarStatus } from '../modules/update-bitrix-car-status.mjs';

const cronTime = '45 0 * * *';
const timeZone = 'Europe/Kiev';
const updateBitrixCarStatusJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await updateBitrixCarStatus();
    } catch (error) {
      console.error('Error occurred in updating car statuses job:', {
        time: new Date(),
        error,
      });
    }
  },
});

export { updateBitrixCarStatusJob };
