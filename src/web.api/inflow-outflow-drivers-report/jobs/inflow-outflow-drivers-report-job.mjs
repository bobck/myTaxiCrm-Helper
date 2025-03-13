import { CronJob } from 'cron';
import { saveCarTransferAcceptanceList } from '../modules/save-car-transfer-acceptance-list.mjs';
import { saveCarTransferAcceptanceCompany } from '../modules/save-car-transfer-acceptance-company.mjs';
import { saveActiveDriversWithScheduleCompany } from '../modules/save-actives-with-schedule-company.mjs';
import { saveActiveDriversWithScheduleEvents } from '../modules/save-actives-with-schedule-events.mjs';

const cronTime = '05 0 * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await saveCarTransferAcceptanceList();
      await saveCarTransferAcceptanceCompany();
      await saveActiveDriversWithScheduleCompany();
      await saveActiveDriversWithScheduleEvents();
    } catch (error) {
      console.error('Error occurred in onTick inflo outflo report gen');
      console.error({
        time: new Date(),
        error,
      });
    }
  },
});

export const inflowOutflowDriversReportJob = job;
