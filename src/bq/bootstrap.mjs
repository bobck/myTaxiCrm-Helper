import { generateAndSaveFleetsIncomAndExpensesReportJob } from './jobs/generate-and-save-fleets-income-and-expenses-report-job.mjs';
import { generateAndSavePolandBookkeepingReportJob } from './jobs/generate-and-save-poland-bookkeeping-report-job.mjs';
import { loadRemonlineTransfersJob } from './jobs/load-remonline-transfers-job.mjs';
import { resetRemonlineTransfersJob } from './jobs/reset-remonline-transfers-job.mjs';
import { loadRemonlineOrdersJob } from './jobs/load-remonline-orders-job.mjs';
import { loadRemonlineOrdersV2Job } from './jobs/load-remonline-orders-v2-job.mjs';
import { loadRemonlineOrderItemsJob } from './jobs/load-remonline-order-items-job.mjs';

export function bqJobs() {
  console.log('bqJobs...');
  try {
    generateAndSaveFleetsIncomAndExpensesReportJob.start();
    generateAndSavePolandBookkeepingReportJob.start();
    resetRemonlineTransfersJob.start();
    loadRemonlineTransfersJob.start();
    loadRemonlineOrdersJob.start();
    loadRemonlineOrdersV2Job.start();
    loadRemonlineOrderItemsJob.start();
  } catch (error) {
    console.error('sync error, app down...');
    console.error({ time: new Date(), error });
    console.error('Trying to restart...');
    generateAndSaveFleetsIncomAndExpensesReportJob.stop();
    generateAndSavePolandBookkeepingReportJob.stop();
    resetRemonlineTransfersJob.stop();
    loadRemonlineTransfersJob.stop();
    loadRemonlineOrdersJob.stop();
    loadRemonlineOrdersV2Job.stop();
    loadRemonlineOrderItemsJob.stop();
    bqJobs();
  }
}
