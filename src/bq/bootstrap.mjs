import { generateAndSaveDriversWithFuelCardsReportJob } from "./jobs/generate-and-save-drivers-with-fuel-cards-report-job.mjs";
import { generateAndSaveFleetsIncomAndExpensesReportJob } from "./jobs/generate-and-save-fleets-income-and-expenses-report-job.mjs";
import { generateAndSaveCarsRoutsReportJob } from "./jobs/generate-and-save-cars-routs-report-job.mjs";
import { generateAndSavePolandBookkeepingReportJob } from "./jobs/generate-and-save-poland-bookkeeping-report-job.mjs";
import { resetRemonlineTransfersJob } from "./jobs/reset-remonline-transfers-job.mjs";
import { loadRemonlineTransfersJob } from "./jobs/load-remonline-transfers-job.mjs";

export function bqJobs() {
    console.log('bqJobs...')
    try {
        generateAndSaveFleetsIncomAndExpensesReportJob.start();
        generateAndSaveCarsRoutsReportJob.start();
        generateAndSavePolandBookkeepingReportJob.start();
        resetRemonlineTransfersJob.start();
        loadRemonlineTransfersJob.start();
    } catch (error) {
        console.error('sync error, app down...')
        console.error({ time: new Date(), error });
        console.error('Trying to restart...')
        resetRemonlineTransfersJob.stop();
        loadRemonlineTransfersJob.stop();
        generateAndSaveFleetsIncomAndExpensesReportJob.stop();
        generateAndSaveCarsRoutsReportJob.stop();
        generateAndSavePolandBookkeepingReportJob.stop();
        bqJobs();
    }
}