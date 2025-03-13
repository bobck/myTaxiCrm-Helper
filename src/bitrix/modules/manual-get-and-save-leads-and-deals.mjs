import { DateTime } from 'luxon';

import { getAndSaveLeadsByCreatedDate } from './get-and-save-leads-by-created-date.mjs';
import { getAndSaveDealsByInterviewDate } from './get-and-save-deals-by-interview-date.mjs';
import { getAndSaveDealsByClosedDate } from './get-and-save-deals-by-closed-date.mjs';
import { getAndSaveDealsRescheduled } from './get-and-save-deals-rescheduled.mjs';
import { saveWorkingDriversWithHistoryStatus } from '../../web.api/gdc-report/modules/save-working-drivers-with-history-status.mjs';
import { saveUniqWorkedDriversAndAvgLifeTime } from '../../web.api/gdc-report/modules/save-uniq-worked-drivers-and-avg-life-time.mjs';
import { saveTemporaryLeaveByDriversEditingHistory } from '../../web.api/gdc-report/modules/temporary-leave-by-drivers-editing-history.mjs';
import { saveMileagesAndHoursOnline } from '../../web.api/gdc-report/modules/save-mileage-total.mjs';
import { saveFiredByDriversLogs } from '../../web.api/gdc-report/modules/save-fired-by-drivers-logs.mjs';
import { saveCarUsageReport } from '../../web.api/gdc-report/modules/save-car-usage-report.mjs';

(async function manualSync() {
  //npm run manualsync -- --minus_days=1
  const minusDaysParam = process.argv.find((arg) =>
    arg.startsWith('--minus_days=')
  );
  const days = minusDaysParam ? minusDaysParam.split('=')[1] : null;

  console.log({ minusDays: days });
  if (!days) {
    return;
  }
  const dateTime = DateTime.now().setZone('Europe/Kyiv').minus({ days });
  const manualDate = dateTime.toFormat('yyyy-MM-dd');

  getAndSaveLeadsByCreatedDate(manualDate);
  getAndSaveDealsByInterviewDate(manualDate);
  getAndSaveDealsByClosedDate(manualDate);
  getAndSaveDealsRescheduled(dateTime);
  saveWorkingDriversWithHistoryStatus(manualDate);
  saveUniqWorkedDriversAndAvgLifeTime(dateTime);
  saveTemporaryLeaveByDriversEditingHistory(manualDate);
  saveMileagesAndHoursOnline(dateTime);
  saveFiredByDriversLogs(manualDate);
  saveCarUsageReport(manualDate);
})();
