import { CronJob } from 'cron';
import { dealForDriversWithRevenue } from '../modules/sync-contact-and-deals.mjs';

const cronTime = '10 10 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      const ownCompanyIds = [
        '4ea03592-9278-4ede-adf8-f7345a856893',
        'b52d5c3c-9a8e-4898-8101-7c65f3ee70a4',
      ];
      await dealForDriversWithRevenue({
        category_id: 3,
        companyIds: ownCompanyIds,
      });

      const b2cCompanyIds = ['3b63b0cc-155b-43c5-a58a-979f6aac0d35'];
      await dealForDriversWithRevenue({
        category_id: 0,
        companyIds: b2cCompanyIds,
      });
    } catch (error) {
      console.error('Error occurred in onTick dealForDriversWithRevenue');
      console.error({
        time: new Date(),
        error,
      });
    }
  },
});

export const dealForDriversWithRevenueJob = job;
