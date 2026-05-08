// import {
//   startRoomNotificationJob,
//   roomNotificationJob,
// } from './jobs/rooms-notification-job.mjs';
import { notifyCarsStatusesJob } from './jobs/notify-cars-statuses-job.mjs';

export function telegramJobs() {
  try {
    // roomNotificationJob.start();
    // console.log('roomNotificationJob...');
    notifyCarsStatusesJob.start();
    console.log('notifyCarsStatusesJob runs...');
  } catch (error) {
    console.error('telegram jobs error, app down...');
    console.error({ time: new Date(), error });
    console.error('Trying to restart...');
    // roomNotificationJob.stop();
    notifyCarsStatusesJob.stop();
    telegramJobs();
  }
}
