import {createAndUpdateDriverBrandingCards} from "../modules/create-and-update-driver-branding-cards.mjs";
import { CronJob } from 'cron';


const timeZone = 'Europe/Kiev';

// Cron expression for every Monday at 7:30
// Day-of-week: 1
const resetBrandingCardJob = CronJob.from({
    cronTime: '30 7 * * 1',
    timeZone,
    onTick: async () => {
        const isNeededToFinish = true;
        try {
            const cards2Upload=25;
            await createAndUpdateDriverBrandingCards(cards2Upload,isNeededToFinish);
        } catch (error) {
            console.error('Error occurred in Friday job:', { time: new Date(), error });
        }
    }
});

// Cron expression for every day but Monday at 7:30
// Day-of-week: 2-7 (Tuesday - Sunday)
const updateBrandingCardJob = CronJob.from({
    cronTime: '30 7 * * 2-7',
    timeZone,
    onTick: async () => {
        const isNeededToFinish = false;
        try {
            const cards2Upload=25;
            await createAndUpdateDriverBrandingCards(cards2Upload,isNeededToFinish);
        } catch (error) {
            console.error('Error occurred in Saturday-Sunday-Monday job:', { time: new Date(), error });
        }
    }
});

// Optionally export or start the jobs:
export { resetBrandingCardJob, updateBrandingCardJob };
