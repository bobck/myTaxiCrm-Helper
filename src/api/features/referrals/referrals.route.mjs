import express from 'express';
import * as ReferralController from './referral.controller.mjs';
const referralRouter = express.Router();

referralRouter.post('/referral-add', ReferralController.addHandler);
referralRouter.post('/referral-validation', ReferralController.validationHandler);
referralRouter.post('/referral-approval', ReferralController.approveHandler);

export default referralRouter;
