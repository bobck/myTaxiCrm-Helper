import { saveAndUpdateSidListJob } from "./jobs/save-and-update-sid-list.mjs";
import { checkIsSidStatusWasUpdatedJob } from "./jobs/update-sid-status-job.mjs";
import { moveOrdersToCloseJob } from "./jobs/close-orders-job.mjs";

export function remonlineJobs() {
    console.log('remonlineJobs...')
    try {
        saveAndUpdateSidListJob.start();
        checkIsSidStatusWasUpdatedJob.start();
        moveOrdersToCloseJob.start();
    } catch (error) {
        console.error('sync error, app down...')
        console.error({ error })
        console.error('Trying to restart...')
        
        saveAndUpdateSidListJob.stop();
        checkIsSidStatusWasUpdatedJob.stop();
        moveOrdersToCloseJob.stop();

        remonlineJobs();
    }
}