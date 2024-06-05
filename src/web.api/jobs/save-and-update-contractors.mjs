import { CronJob } from 'cron';
import { saveContractorsList } from '../modules/save-contractors-list.mjs';
const cronTime = '0 */1 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
    cronTime,
    timeZone,
    onTick: async () => {

        try {
            await saveContractorsList();
        } catch (error) {
            console.error('Error occurred in onTick saveContractorsList');
            console.error({ time: new Date(), error });
        }
    }
});

export const saveContractorsListJob = job;
