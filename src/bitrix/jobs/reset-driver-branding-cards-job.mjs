import {createAndUpdateDriverBrandingCards} from "../modules/create-and-update-driver-branding-cards.mjs";
import { CronJob } from 'cron';

// Cron expression for every Monday at 7:30
// Day-of-week: 1
const resetBrandingCardJob = CronJob.from({
    cronTime: '30 7 * * 1',
    timeZone:'Europe/Kiev',
    onTick: async () => {
        const isNeededToFinish = true;
        try {
            await createAndUpdateDriverBrandingCards(isNeededToFinish);
        } catch (error) {
            console.error('Error occurred in Friday job:', { time: new Date(), error });
        }
    }
});

// Optionally export or start the jobs:
export { resetBrandingCardJob };
