import {
    startRoomNotificationJob,
    roomNotificationJob
} from '../cron/jobs/rooms-notification-job.mjs'

export function bootCron() {
    console.log('roomNotificationJob...')
    try {
        roomNotificationJob.start();
    } catch (error) {
        console.error('sync error, app down...')
        console.error({ error })
        console.error('Trying to restart...')
        roomNotificationJob.stop();
        sync();
    }
}

// bootCron();