import express from 'express';
import * as ReferralController from './referral.controller.mjs';
const referralRouter = express.Router();

referralRouter.post('/validate', ReferralController.validationHandler);
export default referralRouter;
