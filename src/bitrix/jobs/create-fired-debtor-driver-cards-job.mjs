import { CronJob } from 'cron';
import { createFiredDebtorDriversCards } from '../modules/create-fired-debtor-driver-cards.mjs';

// Cron expression for every day at 10:15 AM
const cronTime = '15 10 * * *';
const timeZone = 'Europe/Kiev';
const createFiredDebtorDriversCardsJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await createFiredDebtorDriversCards();
    } catch (error) {
      console.error('Error occurred in creation fired debtor drivers cards:', {
        time: new Date(),
        error,
      });
    }
  },
});

// Optionally export or start the jobs:
export { createFiredDebtorDriversCardsJob };
