import { CronJob } from 'cron';
import { DateTime } from 'luxon';

import { getAndSaveDealsByInterviewDate } from '../../../bitrix/modules/get-and-save-deals-by-interview-date.mjs';
import { saveWorkingDriversWithHistoryStatus } from '../modules/save-working-drivers-with-history-status.mjs';
import { saveTemporaryLeaveByDriversEditingHistory } from '../modules/temporary-leave-by-drivers-editing-history.mjs';
import { saveFiredByDriversLogs } from '../modules/save-fired-by-drivers-logs.mjs';

const cronTime = '*/30 * * * *';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      const dateTime = DateTime.now().setZone('Europe/Kyiv').minus({ days: 0 });
      const manualDate = dateTime.toFormat('yyyy-MM-dd');

      getAndSaveDealsByInterviewDate(manualDate);
      saveWorkingDriversWithHistoryStatus(manualDate);
      saveTemporaryLeaveByDriversEditingHistory(manualDate);
      saveFiredByDriversLogs(manualDate);
    } catch (error) {
      console.error('Error occurred in onTick upToDateCurrentDateGDCReport');
      console.error({ time: new Date(), error });
    }
  },
});

export const upToDateCurrentDateGDCReportJob = job;
