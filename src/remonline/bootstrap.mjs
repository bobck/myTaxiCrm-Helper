import { saveAndUpdateSidListJob } from './jobs/save-and-update-sid-list.mjs';
import { checkIsSidStatusWasUpdatedJob } from './jobs/update-sid-status-job.mjs';
import { moveOrdersToCloseJob } from './jobs/close-orders-job.mjs';
import { loadRemonlinePostingsJob } from './jobs/load-remonline-postings.mjs';
import { loadRemonlineProductsJob } from './jobs/load-remonline-products-job.mjs';
import { syncRemonlineCashboxesJob } from './jobs/sync-remonline-cashboxes-job.mjs';
import { loadRemonlineCashboxTransactionsJob } from './jobs/load-remonline-cashbox-transactions-job.mjs';

export function remonlineJobs() {
  console.log('remonlineJobs...');
  try {
    saveAndUpdateSidListJob.start();
    checkIsSidStatusWasUpdatedJob.start();
    moveOrdersToCloseJob.start();
    loadRemonlinePostingsJob.start();
    loadRemonlineProductsJob.start();
    syncRemonlineCashboxesJob.start();
    loadRemonlineCashboxTransactionsJob.start();
    console.log(
      'syncRemonlineCashboxes and loadRemonlineCashboxTransactions Jobs runs...'
    );
  } catch (error) {
    console.error('sync error, app down...');
    console.error({ time: new Date(), error });
    console.error('Trying to restart...');

    saveAndUpdateSidListJob.stop();
    checkIsSidStatusWasUpdatedJob.stop();
    moveOrdersToCloseJob.stop();
    loadRemonlinePostingsJob.stop();
    loadRemonlineProductsJob.stop();
    syncRemonlineCashboxesJob.stop();
    loadRemonlineCashboxTransactionsJob.stop();

    remonlineJobs();
  }
}
