import { CronJob } from 'cron';
import { loadClients } from '../modules/load-clients.mjs';

const cronTime = '0 3 * * *';
const timeZone = 'Europe/Kiev';

const loadClientsJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await loadClients();
    } catch (e) {
      console.error('An error occurred while loading Remonline clients.');
      console.error(e);
    }
  },
});

export { loadClientsJob };
