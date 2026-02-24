import { runRobotaUaColdSourcingJob } from './robota.ua/jobs/cold_source_robota_ua_job.mjs';
import { getAndSaveRobotaUaVacancyAppliesJob } from './robota.ua/jobs/get_and_save_robotaua_applies_job.mjs';
import { getAndSaveWorkUaVacancyAppliesJob } from './work.ua/jobs/get_and_save_workua_applies_job.mjs';

export const startJobBoardJobs = () => {
  try {
    getAndSaveWorkUaVacancyAppliesJob.start();
    getAndSaveRobotaUaVacancyAppliesJob.start();
    runRobotaUaColdSourcingJob.start();
  } catch (err) {
    console.error(err);
    getAndSaveWorkUaVacancyAppliesJob.stop();
    getAndSaveRobotaUaVacancyAppliesJob.stop();
    runRobotaUaColdSourcingJob.stop();
    startJobBoardJobs();
  }
};
