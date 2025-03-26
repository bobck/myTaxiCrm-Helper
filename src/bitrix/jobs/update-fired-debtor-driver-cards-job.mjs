import { CronJob } from 'cron';
import { updateFiredDebtorDriversCards } from '../modules/update-fired-debtor-driver-cards.mjs';

// Cron expression for every day at 10:00 AM
const cronTime = '30 10 * * *';
const timeZone = 'Europe/Kiev';
const updateFiredDebtorDriversCardsJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await updateFiredDebtorDriversCards();
    } catch (error) {
      console.error('Error occurred in updating fired debtor drivers cards:', {
        time: new Date(),
        error,
      });
    }
  },
});

// Optionally export or start the jobs:
export { updateFiredDebtorDriversCardsJob };
