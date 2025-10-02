import { CronJob } from 'cron';
import {
  loadInsuranceInvoices,
  resetInsuranceInvoicesTable,
} from '../modules/load-insurance-invoices.mjs';

const timeZone = 'Europe/Kiev';

const resetInsuranceInvoicesTableJob = CronJob.from({
  cronTime: '15 1 * * *',
  timeZone,
  onTick: async () => {
    try {
      await resetInsuranceInvoicesTable();
    } catch (e) {
      console.error(
        'An error occurred while resetting insurance invoices table'
      );
      console.error(e);
    }
  },
});

const loadInsuranceInvoicesJob = CronJob.from({
  cronTime: '20 1 * * *',
  timeZone,
  onTick: async () => {
    try {
      await loadInsuranceInvoices();
    } catch (e) {
      console.error('An error occurred while uploading insurance invoices');
      console.error(e);
    }
  },
});
export { loadInsuranceInvoicesJob, resetInsuranceInvoicesTableJob };
