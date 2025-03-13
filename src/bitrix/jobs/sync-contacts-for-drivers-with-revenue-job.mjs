import { CronJob } from 'cron';
import { contactsForDriversWithRevenue } from '../modules/sync-contact-and-deals.mjs';

const cronTime = '40 9 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await contactsForDriversWithRevenue();
    } catch (error) {
      console.error('Error occurred in onTick contactsForDriversWithRevenue');
      console.error({ time: new Date(), error });
    }
  },
});

export const contactsForDriversWithRevenueJob = job;
