import { generateAndSaveDriversWithFuelCardsReportJob } from "./jobs/generate-and-save-drivers-with-fuel-cards-report-job.mjs"; 

export function bqJobs() {
    console.log('bqJobs...')
    try {
        generateAndSaveDriversWithFuelCardsReportJob.start();
    } catch (error) {
        console.error('sync error, app down...')
        console.error({ time: new Date(), error });
        console.error('Trying to restart...')
        generateAndSaveDriversWithFuelCardsReportJob.stop();
        bqJobs();
    }
}