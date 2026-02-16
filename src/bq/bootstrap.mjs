import { generateAndSaveDriversWithFuelCardsReportJob } from './jobs/generate-and-save-drivers-with-fuel-cards-report-job.mjs';https://github.com/bobck/myTaxiCrm-Helper/pull/86/conflict?name=src%252Fremonline%252Fremonline.utils.mjs&ancestor_oid=73e52146a0b9ddd959f8fe741005b0a4536667c9&base_oid=6569b7d004340d833c4e989a3241179fa388390a&head_oid=8fc7d7cfc5ac86668b9ddab3a9922791ce3c5906
import { generateAndSaveFleetsIncomAndExpensesReportJob } from './jobs/generate-and-save-fleets-income-and-expenses-report-job.mjs';
import { generateAndSavePolandBookkeepingReportJob } from './jobs/generate-and-save-poland-bookkeeping-report-job.mjs';
import { loadRemonlineTransfersJob } from './jobs/load-remonline-transfers-job.mjs';
import { resetRemonlineTransfersJob } from './jobs/reset-remonline-transfers-job.mjs';
import { loadRemonlineOrdersJob } from './jobs/load-remonline-orders-job.mjs';
import { resetSecondaryRemonlineTablesJob } from './jobs/reset-secondary-remonline-tables-job.mjs';
import { loadSecondaryRemonlineTablesJob } from './jobs/load-secondary-remonline-tables-job.mjs';

export function bqJobs() {
  console.log('bqJobs...');
  try {
    generateAndSaveFleetsIncomAndExpensesReportJob.start();
    generateAndSavePolandBookkeepingReportJob.start();
    resetRemonlineTransfersJob.start();
    loadRemonlineTransfersJob.start();
    loadRemonlineOrdersJob.start();
    resetSecondaryRemonlineTablesJob.start();
    loadSecondaryRemonlineTablesJob.start();
    loadRemonlinePostingsJob.start();
  } catch (error) {
    console.error('sync error, app down...');
    console.error({ time: new Date(), error });
    console.error('Trying to restart...');
    generateAndSaveFleetsIncomAndExpensesReportJob.stop();
    generateAndSavePolandBookkeepingReportJob.stop();
    resetRemonlineTransfersJob.stop();
    loadRemonlineTransfersJob.stop();
    loadRemonlineOrdersJob.stop();
    resetSecondaryRemonlineTablesJob.stop();
    loadSecondaryRemonlineTablesJob.stop();

    bqJobs();
  }
}
