import { CronJob } from 'cron';
import { saveTemporaryLeaveByDriversEditingHistory } from '../modules/temporary-leave-by-drivers-editing-history.mjs';

const cronTime = '09 0 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await saveTemporaryLeaveByDriversEditingHistory();
    } catch (error) {
      console.error(
        'Error occurred in onTick saveTemporaryLeaveByDriversEditingHistory'
      );
      console.error({ time: new Date(), error });
    }
  },
});

export const saveTemporaryLeaveByDriversEditingHistoryJob = job;
