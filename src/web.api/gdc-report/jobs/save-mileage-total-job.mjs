import { CronJob } from 'cron';
import { saveMileagesAndHoursOnline } from '../modules/save-mileage-total.mjs';  

const cronTime = '11 0 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
    cronTime,
    timeZone,
    onTick: async () => {

        try {
            await saveMileagesAndHoursOnline();
        } catch (error) {
            console.error('Error occurred in onTick saveMileagesAndHoursOnline');
            console.error({ time: new Date(), error });
        }
    }
});

export const saveMileagesAndHoursOnlineJob = job;