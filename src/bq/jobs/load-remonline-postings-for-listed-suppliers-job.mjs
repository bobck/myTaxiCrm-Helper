import { CronJob } from 'cron';
import { loadRemonlinePostingsForListedSuppliers } from '../modules/load-remonline-postings-for-listed-suppliers.mjs';

const cronTime = '0 3 * * *'; // Runs every day at 3:00 AM
const timeZone = 'Europe/Kiev';

const loadRemonlinePostingsForListedSuppliersJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await loadRemonlinePostingsForListedSuppliers();
    } catch (e) {
      console.error(
        'An error occurred while loading RemOnline postings for listed suppliers.'
      );
      console.error(e);
    }
  },
});

export { loadRemonlinePostingsForListedSuppliersJob };

