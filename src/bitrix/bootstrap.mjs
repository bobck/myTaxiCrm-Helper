import { createDealsWithFiredDriversJob } from "./jobs/create-deals-with-fired-drivers-job.mjs";
import { contactsForDriversWithRevenueJob } from "./jobs/sync-contacts-for-drivers-with-revenue-job.mjs";
import { dealForDriversWithRevenueJob } from "./jobs/sync-deals-for-drivers-with-revenue-job.mjs";
import { syncRevenueToDealsJob } from "./jobs/sync-drivers-revenue-to-deal-job.mjs";
import { getAndSaveLeadsByCreatedDateJob } from "./jobs/get-and-save-leads-by-created-date-job.mjs";
import { getAndSaveDealsByInterviewDateJob } from "./jobs/get-and-save-deals-by-interview-date-job.mjs";
import { getAndSaveDealsByClosedDateJob } from "./jobs/get-and-save-deals-by-closed-date-job.mjs";
import { getAndSaveDealsRescheduledJob } from "./jobs/get-and-save-deals-rescheduled-job.mjs";

export function bitrixJobs() {
    console.log('bitrixJobs...')
    try {
        createDealsWithFiredDriversJob.start();
        contactsForDriversWithRevenueJob.start();
        dealForDriversWithRevenueJob.start();
        syncRevenueToDealsJob.start();
        getAndSaveLeadsByCreatedDateJob.start();
        getAndSaveDealsByInterviewDateJob.start();
        getAndSaveDealsByClosedDateJob.start();
        getAndSaveDealsRescheduledJob.start();
    } catch (error) {
        console.error('sync error, app down...')
        console.error({ time: new Date(), error });
        console.error('Trying to restart...')

        createDealsWithFiredDriversJob.stop();
        contactsForDriversWithRevenueJob.stop();
        dealForDriversWithRevenueJob.stop();
        syncRevenueToDealsJob.stop();
        getAndSaveLeadsByCreatedDateJob.stop();
        getAndSaveDealsByInterviewDateJob.stop();
        getAndSaveDealsByClosedDateJob.stop();
        getAndSaveDealsRescheduledJob.stop();

        bitrixJobs();
    }
}