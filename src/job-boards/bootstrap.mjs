import { getAndSaveRobotaUaVacancyAppliesJob } from './robota.ua/jobs/get_and_save_robotaua_applies_job.mjs';
import { getAndSaveRobotaUaVacanciesJob } from './robota.ua/jobs/get_and_save_robotaua_vacancies_job.mjs';
import { getAndSaveWorkUaVacancyAppliesJob } from './work.ua/jobs/get_and_save_workua_applies_job.mjs';
import { getAndSaveWorkUaVacanciesJob } from './work.ua/jobs/get_and_save_workua_vacancies_job.mjs';

export const startJobBoardJobs = () => {
  try {
    getAndSaveWorkUaVacanciesJob.start();
    getAndSaveWorkUaVacancyAppliesJob.start();
    getAndSaveRobotaUaVacanciesJob.start();
    getAndSaveRobotaUaVacancyAppliesJob.start();
  } catch (err) {
    console.log(err);
    getAndSaveWorkUaVacanciesJob.stop();
    getAndSaveWorkUaVacancyAppliesJob.stop();
    getAndSaveRobotaUaVacanciesJob.stop();
    getAndSaveRobotaUaVacancyAppliesJob.stop();
    startJobBoardJobs();
  }
};
