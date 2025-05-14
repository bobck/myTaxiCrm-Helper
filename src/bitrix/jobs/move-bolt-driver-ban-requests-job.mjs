import { CronJob } from 'cron';
import { moveBoltDriversToBan } from '../modules/move-bolt-drivers-to-ban.mjs';

const cronTime = '0 8 * * *'; // Runs every day at 8:00 AM
const timeZone = 'Europe/Kiev';

const moveBoltDriverBanRequestsJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await moveBoltDriversToBan();
    } catch (error) {
      console.error('Error occurred in onTick createBoltDriverBanRequests');
      console.error({ time: new Date(), error });
    }
  },
});

export { moveBoltDriverBanRequestsJob };
