import { CronJob } from 'cron';
import { saveCarUsageReport } from '../modules/save-car-usage-report.mjs';

const cronTime = '0 4,8,9 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
    cronTime,
    timeZone,
    onTick: async () => {

        try {
            await saveCarUsageReport();
        } catch (error) {
            console.error('Error occurred in onTick saveCarUsageReport');
            console.error({ time: new Date(), error });
        }
    }
});

export const saveCarUsageReportJob = job;