// import { getAndSaveRobotaUaVacancyAppliesJob } from './robota.ua/jobs/get_and_save_robotaua_applies_job.mjs';
import { getAndSaveWorkUaVacancyAppliesJob } from './work.ua/jobs/get_and_save_workua_applies_job.mjs';

export const startJobBoardJobs = () => {
  try {
    getAndSaveWorkUaVacancyAppliesJob.start();
    // getAndSaveRobotaUaVacancyAppliesJob.start();
  } catch (err) {
    console.log(err);
    getAndSaveWorkUaVacancyAppliesJob.stop();
    // getAndSaveRobotaUaVacancyAppliesJob.stop();
    startJobBoardJobs();
  }
};
