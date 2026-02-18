import { CronJob } from 'cron';
import { loadRemonlinePostings } from '../modules/load-remonline-postings.mjs';

const cronTime = '0 * * * *'; 
const timeZone = 'Europe/Kiev';

const loadRemonlinePostingsJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await loadRemonlinePostings();
    } catch (e) {
      console.error(
        'An error occurred while loading RemOnline postings for listed suppliers.'
      );
      console.error(e);
    }
  },
});

export { loadRemonlinePostingsJob };
