import { CronJob } from 'cron';
import { syncInsuranceInvoices } from '../modules/sync-insurance-invoices.mjs';

const cronTime = '20 1 * * *';
const timeZone = 'Europe/Kiev';

const syncInsuranceInvoicesJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await syncInsuranceInvoices();
    } catch (e) {
      console.error('An error occurred while syncing insurance invoices');
      console.error(e);
    }
  },
});

export { syncInsuranceInvoicesJob };
