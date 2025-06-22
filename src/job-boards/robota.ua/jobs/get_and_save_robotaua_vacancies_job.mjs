import { CronJob } from 'cron';
import { getAndSaveRobotaUaVacancies } from '../modules/get_and_save_robotaua_vacancies.mjs';

const cronTime = '*/20 * * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await getAndSaveRobotaUaVacancies();
    } catch (error) {
      console.error('Error occurred in onTick on getAndSaveRobotaUaVacancies');
      console.error({ time: new Date(), error });
    }
  },
});

export const getAndSaveRobotaUaVacanciesJob = job;
