import { CronJob } from 'cron';
import { updateDriverBrandingCards } from '../modules/update-driver-branding-cards.mjs';

// Cron expression for every day but Monday at 7:30
// Day-of-week: 6,0 (saturday, sunday)
const cronTime = '30 7 * * 6,0';
const timeZone = 'Europe/Kiev';
const updateBrandingCardsJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await updateDriverBrandingCards();
    } catch (error) {
      console.error('Error occurred in updating branding job:', {
        time: new Date(),
        error,
      });
    }
  },
});

export { updateBrandingCardsJob };
