import { CronJob } from 'cron';
import { saveWorkingDriversWithHistoryStatus } from '../modules/save-working-drivers-with-history-status.mjs';

const cronTime = '05 0 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
    cronTime,
    timeZone,
    onTick: async () => {

        try {
            await saveWorkingDriversWithHistoryStatus();
        } catch (error) {
            console.error('Error occurred in onTick saveWorkingDriversWithHistoryStatus');
            console.error({ time: new Date(), error });
        }
    }
});

export const saveWorkingDriversWithHistoryStatusJob = job;