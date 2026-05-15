import { generateAndSaveFleetsIncomAndExpensesReportJob } from './jobs/generate-and-save-fleets-income-and-expenses-report-job.mjs';
import { generateAndSavePolandBookkeepingReportJob } from './jobs/generate-and-save-poland-bookkeeping-report-job.mjs';
import { loadRemonlineTransfersJob } from './jobs/load-remonline-transfers-job.mjs';
import { resetRemonlineTransfersJob } from './jobs/reset-remonline-transfers-job.mjs';

export function bqJobs() {
  console.log('bqJobs...');
  try {
    generateAndSaveFleetsIncomAndExpensesReportJob.start();
    generateAndSavePolandBookkeepingReportJob.start();
    resetRemonlineTransfersJob.start();
    loadRemonlineTransfersJob.start();
  } catch (error) {
    console.error('sync error, app down...');
    console.error({ time: new Date(), error });
    console.error('Trying to restart...');
    generateAndSaveFleetsIncomAndExpensesReportJob.stop();
    generateAndSavePolandBookkeepingReportJob.stop();
    resetRemonlineTransfersJob.stop();
    loadRemonlineTransfersJob.stop();
    bqJobs();
  }
}
