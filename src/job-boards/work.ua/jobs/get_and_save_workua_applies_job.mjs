import { CronJob } from 'cron';
import { getAndSaveWorkUaVacancyApplies } from '../modules/get_and_save_workua_applies.mjs';

const cronTime = '*/20 * * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await getAndSaveWorkUaVacancyApplies();
    } catch (error) {
      console.error(
        'Error occurred in onTick on getAndSaveWorkUaVacancyApplies'
      );
      console.error({ time: new Date(), error });
    }
  },
});

export const getAndSaveWorkUaVacancyAppliesJob = job;
