import { generateAndSaveDriversWithFuelCardsReportJob } from "./jobs/generate-and-save-drivers-with-fuel-cards-report-job.mjs";
import { generateAndSaveFleetsIncomAndExpensesReportJob } from "./jobs/generate-and-save-fleets-income-and-expenses-report-job.mjs";
import { generateAndSaveCarsRoutsReportJob } from "./jobs/generate-and-save-cars-routs-report-job.mjs";

export function bqJobs() {
    console.log('bqJobs...')
    try {
        generateAndSaveFleetsIncomAndExpensesReportJob.start();
        generateAndSaveCarsRoutsReportJob.start();
    } catch (error) {
        console.error('sync error, app down...')
        console.error({ time: new Date(), error });
        console.error('Trying to restart...')
        generateAndSaveFleetsIncomAndExpensesReportJob.stop();
        generateAndSaveCarsRoutsReportJob.stop();
        bqJobs();
    }
}