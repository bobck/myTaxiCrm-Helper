import { generateAndSaveDriversWithFuelCardsReportJob } from './jobs/generate-and-save-drivers-with-fuel-cards-report-job.mjs';
import { generateAndSaveFleetsIncomAndExpensesReportJob } from './jobs/generate-and-save-fleets-income-and-expenses-report-job.mjs';
import { generateAndSaveCarsRoutsReportJob } from './jobs/generate-and-save-cars-routs-report-job.mjs';
import { generateAndSavePolandBookkeepingReportJob } from './jobs/generate-and-save-poland-bookkeeping-report-job.mjs';
import { loadRemonlineTransfersJob } from './jobs/load-remonline-transfers-job.mjs';
import { resetRemonlineTransfersJob } from './jobs/reset-remonline-transfers-job.mjs';
import { loadRemonlineOrdersJob } from './jobs/load-remonline-orders-job.mjs';
import { resetSecondaryRemonlineTablesJob } from './jobs/reset-secondary-remonline-tables-job.mjs';
import { loadSecondaryRemonlineTablesJob } from './jobs/load-secondary-remonline-tables-job.mjs';
import {
  loadInsuranceInvoicesJob,
  resetInsuranceInvoicesTableJob,
} from './jobs/reset-and-load-insurance-invoices-job.mjs';
export function bqJobs() {
  console.log('bqJobs...');
  try {
    generateAndSaveFleetsIncomAndExpensesReportJob.start();
    generateAndSaveCarsRoutsReportJob.start();
    generateAndSavePolandBookkeepingReportJob.start();
    resetRemonlineTransfersJob.start();
    loadRemonlineTransfersJob.start();
    loadRemonlineOrdersJob.start();
    resetSecondaryRemonlineTablesJob.start();
    loadSecondaryRemonlineTablesJob.start();
    resetInsuranceInvoicesTableJob.start();
    loadInsuranceInvoicesJob.start();
  } catch (error) {
    console.error('sync error, app down...');
    console.error({ time: new Date(), error });
    console.error('Trying to restart...');
    generateAndSaveFleetsIncomAndExpensesReportJob.stop();
    generateAndSaveCarsRoutsReportJob.stop();
    generateAndSavePolandBookkeepingReportJob.stop();
    resetRemonlineTransfersJob.stop();
    loadRemonlineTransfersJob.stop();
    loadRemonlineOrdersJob.stop();
    resetSecondaryRemonlineTablesJob.stop();
    loadSecondaryRemonlineTablesJob.stop();
    resetInsuranceInvoicesTableJob.stop();
    loadInsuranceInvoicesJob.stop();
    bqJobs();
  }
}
