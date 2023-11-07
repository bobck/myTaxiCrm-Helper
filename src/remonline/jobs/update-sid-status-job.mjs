import { CronJob } from 'cron';
import { checkIsSidStatusWasUpdated } from '../modules/update-sids-status.mjs';

const cronTime = '10 */2 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
    cronTime,
    timeZone,
    onTick: async () => {
        try {
            await checkIsSidStatusWasUpdated();
        } catch (error) {
            console.error('Error occurred in onTick checkIsSidStatusWasUpdatedJob');
            console.error(error);
        }
    }
});

export const checkIsSidStatusWasUpdatedJob = job;
export const startCheckIsSidStatusWasUpdatedJob = () => job.start();