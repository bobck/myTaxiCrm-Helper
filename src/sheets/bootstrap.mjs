import { getAndSaveCurrentPlanJob } from './jobs/get-and-save-current-plan-job.mjs';

export function sheetJobs() {
    console.log('sheetJobs...')
    try {
        getAndSaveCurrentPlanJob.start();
    } catch (error) {
        console.error('sync error, app down...')
        console.error({ time: new Date(), error });
        console.error('Trying to restart...')
        getAndSaveCurrentPlanJob.stop();
        sheetJobs();
    }
}