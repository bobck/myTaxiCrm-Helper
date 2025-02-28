import {CronJob} from "cron";
import {createAndUpdateDriverBrandingCards} from "../modules/create-and-update-driver-branding-cards.mjs";


// Cron expression for every day but Monday at 7:30
// Day-of-week: 2-7 (Tuesday - Sunday)
const updateBrandingCardJob = CronJob.from({
    cronTime: '30 7 * * 2-7',
    timeZone:'Europe/Kiev',
    onTick: async () => {
        const isNeededToFinish = false;
        try {
            await createAndUpdateDriverBrandingCards(isNeededToFinish);
        } catch (error) {
            console.error('Error occurred in Saturday-Sunday-Monday job:', { time: new Date(), error });
        }
    }
});

export {updateBrandingCardJob};