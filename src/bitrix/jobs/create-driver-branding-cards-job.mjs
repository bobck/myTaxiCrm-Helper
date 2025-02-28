import {createAndUpdateDriverBrandingCards} from "../modules/create-and-update-driver-branding-cards.mjs";
import { CronJob } from 'cron';


const timeZone = 'Europe/Kiev';

// Cron expression for every Friday at 7:00
// Day-of-week: 5
const fridayJob = CronJob.from({
    cronTime: '0 7 * * 5',
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

// Cron expression for every Saturday, Sunday, and Monday at 7:00
// Day-of-week: 6 (Saturday), 0 (Sunday), 1 (Monday)
const weekendJob = CronJob.from({
    cronTime: '0 7 * * 6,0,1',
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
export { fridayJob, weekendJob };
