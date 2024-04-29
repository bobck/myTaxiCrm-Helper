import { createDealsWithFiredDriversJob } from "./jobs/create-deals-with-fired-drivers-job.mjs";

export function bitrixJobs() {
    console.log('bitrixJobs...')
    try {
        createDealsWithFiredDriversJob.start();
    } catch (error) {
        console.error('sync error, app down...')
        console.error({ time: new Date(), error });
        console.error('Trying to restart...')
        
        createDealsWithFiredDriversJob.stop();
        bitrixJobs();
    }
}