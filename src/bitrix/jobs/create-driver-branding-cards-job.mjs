import { CronJob } from 'cron';
import {createDriverBrandingCards} from "../modules/create-and-update-driver-branding-cards.mjs";

// Cron expression for every Monday at 7:30
// Day-of-week: 1
const createBrandingCardsJob = CronJob.from({
    cronTime: '30 7 * * 1',
    timeZone:'Europe/Kiev',
    onTick: async () => {

        try {
            await createDriverBrandingCards();
        } catch (error) {
            console.error('Error occurred in monday branding job:', { time: new Date(), error });
        }
    }
});

// Optionally export or start the jobs:
export { createBrandingCardsJob };
