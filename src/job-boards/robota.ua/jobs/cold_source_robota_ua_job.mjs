import { CronJob } from 'cron';
import { runRobotaUaColdSourcing } from '../modules/cold_sourcing.mjs';

const cronTime = '* 7 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await runRobotaUaColdSourcing();
    } catch (error) {
      console.error('Error occurred in onTick on runRobotaUaColdSourcingJob');
      console.error({ time: new Date(), error });
    }
  },
});

export const runRobotaUaColdSourcingJob = job;
