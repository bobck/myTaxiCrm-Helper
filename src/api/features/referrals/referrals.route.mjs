import express from 'express';
import * as ReferralController from './referral.controller.mjs';
const referralRouter = express.Router();

referralRouter.post('/add', ReferralController.addHandler);
referralRouter.post('/validate', ReferralController.validationHandler);
referralRouter.post('/approve', ReferralController.approveHandler);



export default referralRouter;
