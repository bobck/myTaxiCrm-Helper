import { saveAndUpdateSidListJob } from './jobs/save-and-update-sid-list.mjs';
import { checkIsSidStatusWasUpdatedJob } from './jobs/update-sid-status-job.mjs';
import { moveOrdersToCloseJob } from './jobs/close-orders-job.mjs';
import { loadRemonlinePostingsJob } from './jobs/load-remonline-postings.mjs';

export function remonlineJobs() {
  console.log('remonlineJobs...');
  try {
    saveAndUpdateSidListJob.start();
    checkIsSidStatusWasUpdatedJob.start();
    moveOrdersToCloseJob.start();
    loadRemonlinePostingsJob.start();
  } catch (error) {
    console.error('sync error, app down...');
    console.error({ time: new Date(), error });
    console.error('Trying to restart...');

    saveAndUpdateSidListJob.stop();
    checkIsSidStatusWasUpdatedJob.stop();
    moveOrdersToCloseJob.stop();
    loadRemonlinePostingsJob.stop();

    remonlineJobs();
  }
}
