import { CronJob } from 'cron';
import { saveUniqWorkedDriversAndAvgLifeTime } from '../modules/save-uniq-worked-drivers-and-avg-life-time.mjs';

const cronTime = '07 0 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await saveUniqWorkedDriversAndAvgLifeTime();
    } catch (error) {
      console.error(
        'Error occurred in onTick saveUniqWorkedDriversAndAvgLifeTime'
      );
      console.error({ time: new Date(), error });
    }
  },
});

export const saveUniqWorkedDriversAndAvgLifeTimeJob = job;
