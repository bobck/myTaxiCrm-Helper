import { CronJob } from 'cron';
import { getAndSaveWorkUaVacancies } from '../modules/get_and_save_workua_vacancies.mjs';

const cronTime = '*/20 * * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await getAndSaveWorkUaVacancies();
    } catch (error) {
      console.error('Error occurred in onTick on getAndSaveWorkUaVacancies');
      console.error({ time: new Date(), error });
    }
  },
});

export const getAndSaveWorkUaVacanciesJob = job;
