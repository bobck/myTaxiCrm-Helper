import { CronJob } from 'cron';
import { getAndSaveRobotaUaVacancyApplies } from '../modules/get_and_save_robotaua_applies.mjs';
import { reinitializeRobotaUaAPI } from '../robotaua.utils.mjs';

const cronTime = '*/20 * * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await reinitializeRobotaUaAPI();
      await getAndSaveRobotaUaVacancyApplies();
    } catch (error) {
      console.error(
        'Error occurred in onTick on getAndSaveRobotaUaVacancyApplies'
      );
      console.error({ time: new Date(), error });
    }
  },
});

export const getAndSaveRobotaUaVacancyAppliesJob = job;
