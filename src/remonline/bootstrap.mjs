import { saveAndUpdateSidListJob } from './jobs/save-and-update-sid-list.mjs';
import { checkIsSidStatusWasUpdatedJob } from './jobs/update-sid-status-job.mjs';
import { moveOrdersToCloseJob } from './jobs/close-orders-job.mjs';
import { loadOutCashboxesJob } from './jobs/load-out-cashboxes-job.mjs';
import { loadOutCashboxTransactionsJob } from './jobs/load-out-cashbox-transactions-job.mjs';

export function remonlineJobs() {
  console.log('remonlineJobs...');
  try {
    saveAndUpdateSidListJob.start();
    checkIsSidStatusWasUpdatedJob.start();
    moveOrdersToCloseJob.start();
    loadOutCashboxesJob.start();
    loadOutCashboxTransactionsJob.start();
  } catch (error) {
    console.error('sync error, app down...');
    console.error({ time: new Date(), error });
    console.error('Trying to restart...');

    saveAndUpdateSidListJob.stop();
    checkIsSidStatusWasUpdatedJob.stop();
    moveOrdersToCloseJob.stop();
    loadOutCashboxesJob.stop();
    loadOutCashboxTransactionsJob.stop();
    remonlineJobs();
  }
}
