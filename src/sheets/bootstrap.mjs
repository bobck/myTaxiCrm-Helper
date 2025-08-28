import { getAndSaveCurrentPlanJob } from './jobs/get-and-save-current-plan-job.mjs';
import { synchronizeDriversIgnoringDCBRJob } from './jobs/sync-drivers-ignoring-dcbr-job.mjs';

export function sheetJobs() {
  console.log('sheetJobs...');
  try {
    // getAndSaveCurrentPlanJob.start();
    synchronizeDriversIgnoringDCBRJob.start();
  } catch (error) {
  //   console.error('sync error, app down...');
  //   console.error({ time: new Date(), error });
  //   console.error('Trying to restart...');
  //   getAndSaveCurrentPlanJob.stop();
    synchronizeDriversIgnoringDCBRJob.stop();
    sheetJobs();
  }
}
