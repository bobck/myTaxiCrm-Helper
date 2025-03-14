import { CronJob } from 'cron';
import { addNewDriversAutoparkRevenue } from '../modules/add-and-update-drivers-with-revenue.mjs';

const cronTime = '0 9 * * *';

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
      await addNewDriversAutoparkRevenue({
        autoParksIds: ownCompanyIds,
        fromYear: 2000,
        fromWeek: 0,
      });

      const b2cCompanyIds = ['3b63b0cc-155b-43c5-a58a-979f6aac0d35'];
      await addNewDriversAutoparkRevenue({
        autoParksIds: b2cCompanyIds,
        fromYear: 2024,
        fromWeek: 10,
      });
    } catch (error) {
      console.error('Error occurred in onTick addNewDriversAutoparkRevenue');
      console.error({ time: new Date(), error });
    }
  },
});

export const addNewDriversAutoparkRevenueJob = job;
