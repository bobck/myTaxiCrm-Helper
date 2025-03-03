import {CronJob} from "cron";
import {
    updateDriverBrandingCards
} from "../modules/create-and-update-driver-branding-cards.mjs";

// Cron expression for every day but Monday at 7:30
// Day-of-week: 2-7 (Tuesday - Sunday)
const updateBrandingCardsJob = CronJob.from({
    cronTime: '30 7 * * 2-7',
    timeZone:'Europe/Kiev',
    onTick: async () => {

        try {
            await updateDriverBrandingCards();
        } catch (error) {
            console.error('Error occurred in Tuesday-Sunday branding job:', { time: new Date(), error });
        }
    }
});

export {updateBrandingCardsJob};