import { createDealsWithFiredDriversJob } from './jobs/create-deals-with-fired-drivers-job.mjs';
import { contactsForDriversWithRevenueJob } from './jobs/sync-contacts-for-drivers-with-revenue-job.mjs';
import { dealForDriversWithRevenueJob } from './jobs/sync-deals-for-drivers-with-revenue-job.mjs';
import { syncRevenueToDealsJob } from './jobs/sync-drivers-revenue-to-deal-job.mjs';
import { getAndSaveLeadsByCreatedDateJob } from './jobs/get-and-save-leads-by-created-date-job.mjs';
import { getAndSaveDealsByInterviewDateJob } from './jobs/get-and-save-deals-by-interview-date-job.mjs';
import { getAndSaveDealsByClosedDateJob } from './jobs/get-and-save-deals-by-closed-date-job.mjs';
import { getAndSaveDealsRescheduledJob } from './jobs/get-and-save-deals-rescheduled-job.mjs';
import { getAndUpdateManifoldDealsJob } from './jobs/get-and-update-manifold-deals-job.mjs';
import { refreshManifoldDealsJob } from './jobs/save-manifold-deals-job.mjs';
import { createRefferalPaymentJob } from './jobs/create-refferal-payment-job.mjs';
import { moveReferralToClosedJob } from './jobs/move-referral-to-closed-job.mjs';
import { saveNewWorkingDriversJob } from './jobs/create-new-working-drivers-job.mjs';
import { moveNewWorkingDriversJob } from './jobs/move-working-drivers-job.mjs';
import { createRefferalPaymentProcentageRewardJob } from './jobs/create-refferal-payment-procentage-reward-job.mjs';
import { getAndSaveDtpDebtTransactionsJob } from './jobs/get-and-save-dtp-debt-transactions-job.mjs';
import { checkDtpDealIdIsValidJob } from './jobs/check-dtp-deal-is-id-valid-job.mjs';
import { accrueDebtToDealJob } from './jobs/accrue-debt-to-deal-job.mjs';
import { createBoltDriverBanRequestsJob } from './jobs/create-bolt-driver-ban-requests-job.mjs';
import { createBrandingCardsJob } from './jobs/create-driver-branding-cards-job.mjs';
import { updateBrandingCardsJob } from './jobs/update-driver-branding-cards-job.mjs';
import { moveBrandingCardsJob } from './jobs/move-driver-branding-cards-job.mjs';

export function bitrixJobs() {
  try {
    createDealsWithFiredDriversJob.start();
    contactsForDriversWithRevenueJob.start();
    dealForDriversWithRevenueJob.start();
    syncRevenueToDealsJob.start();
    getAndSaveLeadsByCreatedDateJob.start();
    getAndSaveDealsByInterviewDateJob.start();
    getAndSaveDealsByClosedDateJob.start();
    getAndSaveDealsRescheduledJob.start();
    getAndUpdateManifoldDealsJob.start();
    refreshManifoldDealsJob.start();
    createRefferalPaymentJob.start();
    moveReferralToClosedJob.start();
    saveNewWorkingDriversJob.start();
    moveNewWorkingDriversJob.start();
    createRefferalPaymentProcentageRewardJob.start();
    getAndSaveDtpDebtTransactionsJob.start();
    checkDtpDealIdIsValidJob.start();
    accrueDebtToDealJob.start();
    createBrandingCardsJob.start();
    updateBrandingCardsJob.start();
    moveBrandingCardsJob.start();
    createBoltDriverBanRequestsJob.start();
    console.log('Bitrix Jobs has been started');
  } catch (error) {
    console.error({
      message: 'Bitrix Jobs Sync error, app down...',
      time: new Date(),
      error,
    });
    createBoltDriverBanRequestsJob.stop();
    createBrandingCardsJob.stop();
    updateBrandingCardsJob.stop();
    moveBrandingCardsJob.stop();
    createDealsWithFiredDriversJob.stop();
    contactsForDriversWithRevenueJob.stop();
    dealForDriversWithRevenueJob.stop();
    syncRevenueToDealsJob.stop();
    getAndSaveLeadsByCreatedDateJob.stop();
    getAndSaveDealsByInterviewDateJob.stop();
    getAndSaveDealsByClosedDateJob.stop();
    getAndSaveDealsRescheduledJob.stop();
    getAndUpdateManifoldDealsJob.stop();
    refreshManifoldDealsJob.stop();
    createRefferalPaymentJob.stop();
    moveReferralToClosedJob.stop();
    saveNewWorkingDriversJob.stop();
    moveNewWorkingDriversJob.stop();
    createRefferalPaymentProcentageRewardJob.stop();
    getAndSaveDtpDebtTransactionsJob.stop();
    checkDtpDealIdIsValidJob.stop();
    accrueDebtToDealJob.stop();
    bitrixJobs();
  }
}
