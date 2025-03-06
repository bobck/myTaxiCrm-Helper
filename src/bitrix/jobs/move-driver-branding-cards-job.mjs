import { CronJob } from "cron";
import { moveDriverBrandingCards } from "../modules/move-driver-branding-cards.mjs";

// Cron expression for every Monday at 7:20
// Day-of-week: 1
const cronTime = "30 7 * * 1";
const timeZone = "Europe/Kiev";
const moveBrandingCardsJob = CronJob.from({
    cronTime,
    timeZone,
    onTick: async () => {
        try {
            await moveDriverBrandingCards();
        } catch (error) {
            console.error("Error occurred in monday branding job:", { time: new Date(), error });
        }
    },
});

// Optionally export or start the jobs:
export { moveBrandingCardsJob };
