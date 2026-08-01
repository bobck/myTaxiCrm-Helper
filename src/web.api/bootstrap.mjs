import { saveContractorsListJob } from './jobs/save-and-update-contractors.mjs';
import { addNewDriversAutoparkRevenueJob } from './jobs/add-drivers-with-revenue-job.mjs';
import { updateDriversWithRevenueJob } from './jobs/update-drivers-with-revenue-job.mjs';
import { saveWorkingDriversWithHistoryStatusJob } from './gdc-report/jobs/save-working-drivers-with-history-status-job.mjs';
import { saveUniqWorkedDriversAndAvgLifeTimeJob } from './gdc-report/jobs/save-uniq-worked-drivers-and-avg-life-time-job.mjs';
import { saveTemporaryLeaveByDriversEditingHistoryJob } from './gdc-report/jobs/temporary-leave-by-drivers-editing-history-job.mjs';
import { saveMileagesAndHoursOnlineJob } from './gdc-report/jobs/save-mileage-total-job.mjs';
import { saveFiredByDriversLogsJob } from './gdc-report/jobs/save-fired-by-drivers-logs-job.mjs';
import { saveCarUsageReportJob } from './gdc-report/jobs/save-car-usage-report-job.mjs';
import { inflowOutflowDriversReportJob } from './inflow-outflow-drivers-report/jobs/inflow-outflow-drivers-report-job.mjs';
import { upToDateCurrentDateGDCReportJob } from './gdc-report/jobs/up-to-date-current-date.mjs';
import { saveRepairAndAccidentCarsReportJob } from './jobs/save-repair-and-accident-cars-job.mjs';
import { getAndSaveClosedPolishBitrixDealsJob } from './gdc-report/jobs/get-and-save-closed-polish-bitrix-deals-job.mjs';
import { updateAndSaveDriverCashBlockRulesJob } from './jobs/update-and-save-driver-cash-block-rules-job.mjs';

export function webApiJobs() {
  try {
    saveContractorsListJob.start();
    updateDriversWithRevenueJob.start();
    addNewDriversAutoparkRevenueJob.start();
    console.log('add and update DriversWithRevenue Job runs...');
    saveWorkingDriversWithHistoryStatusJob.start();
    saveUniqWorkedDriversAndAvgLifeTimeJob.start();
    saveTemporaryLeaveByDriversEditingHistoryJob.start();
    saveMileagesAndHoursOnlineJob.start();
    saveFiredByDriversLogsJob.start();
    saveCarUsageReportJob.start();
    upToDateCurrentDateGDCReportJob.start();
    console.log('GDC report Job runs...');
    inflowOutflowDriversReportJob.start();
    console.log('inflowOutflowDriversReport Job runs...');
    saveRepairAndAccidentCarsReportJob.start();
    getAndSaveClosedPolishBitrixDealsJob.start();
    updateAndSaveDriverCashBlockRulesJob.start();
  } catch (error) {
    console.error('sync error, app down...');
    console.error({ time: new Date(), error });
    console.error('Trying to restart...');
    saveContractorsListJob.stop();

    updateDriversWithRevenueJob.stop();
    addNewDriversAutoparkRevenueJob.stop();

    saveWorkingDriversWithHistoryStatusJob.stop();
    saveUniqWorkedDriversAndAvgLifeTimeJob.stop();
    saveTemporaryLeaveByDriversEditingHistoryJob.stop();
    saveMileagesAndHoursOnlineJob.stop();
    saveFiredByDriversLogsJob.stop();
    saveCarUsageReportJob.stop();

    upToDateCurrentDateGDCReportJob.stop();
    inflowOutflowDriversReportJob.stop();
    saveRepairAndAccidentCarsReportJob.stop();
    getAndSaveClosedPolishBitrixDealsJob.stop();

    updateAndSaveDriverCashBlockRulesJob.stop();
    webApiJobs();
  }
}
