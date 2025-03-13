import {
  startRoomNotificationJob,
  roomNotificationJob,
} from './jobs/rooms-notification-job.mjs';

export function telegramJobs() {
  console.log('roomNotificationJob...');
  try {
    roomNotificationJob.start();
  } catch (error) {
    console.error('sync error, app down...');
    console.error({
      time: new Date(),
      error,
    });
    console.error('Trying to restart...');
    roomNotificationJob.stop();
    telegramJobs();
  }
}

// telegranJobs();
