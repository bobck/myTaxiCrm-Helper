import express from 'express';
import { queryHandler } from './modules/queryHandler.mjs';
import {
  referralAddHandler,
  referralValidationHandler,
  referralApprovalHandler
} from './modules/referralHandlers.mjs';
import { boltIdVerificationHandler } from './modules/boltIdVerification.mjs';
export async function initApi({ pool }) {
  const app = express();
  app.use(express.json());

  app.post('/query', queryHandler);

  app.post('/referral-validation', referralValidationHandler);

  app.post('/referral-add', referralAddHandler);

  app.post('/referral-approval',referralApprovalHandler);

  app.post('/verify',boltIdVerificationHandler );

  app.listen(3000);

  console.log({
    message: 'Express listening',
    time: new Date(),
  });
}
