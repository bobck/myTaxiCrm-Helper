import { CronJob } from 'cron';
import { saveSidList } from '../modules/save-sid-list.mjs';
import { saveOrdersToSids } from '../modules/save-orders-to-sid.mjs';

const cronTime = '0 */2 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
    cronTime,
    timeZone,
    onTick: async () => {
        try {
            await saveSidList();
            await saveOrdersToSids();
        } catch (error) {
            console.error('Error occurred in onTick saveAndUpdateSidListJob');
            console.error({ time: new Date(), error });
        }
    }
});

export const saveAndUpdateSidListJob = job;
export const startSaveAndUpdateSidListJob = () => job.start();