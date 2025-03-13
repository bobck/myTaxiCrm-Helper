import { CronJob } from 'cron';
import { startRoomsNotification } from '../modules/rooms-notification.mjs';

// const cronTime = '* * * * *';
const cronTime = '0 9,12,15,18,21 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await startRoomsNotification();
    } catch (error) {
      console.error('Error occurred in onTick roomNotificationJob');
      console.error({
        time: new Date(),
        error,
      });
    }
  },
});

export const roomNotificationJob = job;
export const startRoomNotificationJob = () => job.start();
