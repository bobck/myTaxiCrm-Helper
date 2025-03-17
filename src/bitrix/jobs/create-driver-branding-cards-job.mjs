import { CronJob } from 'cron';
import { createDriverBrandingCards } from '../modules/create-driver-branding-cards.mjs';

// Cron expression for every Monday at 7:30
// Day-of-week: 5 Friday
const cronTime = '30 7 * * 5';
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
