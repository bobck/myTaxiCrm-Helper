import { CronJob } from 'cron';
import { createDriverBrandingCards } from '../modules/create-driver-branding-cards.mjs';

// Cron expression: "30 7-23/2 * * 5"
// This translates to every Friday at 7:30, 9:30, 11:30, ..., 23:30.
const cronTime = '30 7-23/2 * * 5';
const timeZone = 'Europe/Kiev';

const createBrandingCardsJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await createDriverBrandingCards();
    } catch (error) {
      console.error('Error occurred in creation branding job:', {
        time: new Date(),
        error,
      });
    }
  },
});

// Optionally export or start the jobs:
export { createBrandingCardsJob };
