import express from 'express';
import { queryHandler } from './modules/queryHandler.mjs';
import {
  referralAddHandler,
  referralValidationHandler,
  referralApprovalHandler,
} from './modules/referralHandlers.mjs';
import { sentFirstDriverLetterToBolt } from './modules/sentFirstDriverLetterToBoltHandler.mjs';
import boltRouter from './routes/bolt.router.mjs';
export async function initApi({ pool }) {
  const app = express();
  app.use(express.json());

  app.post('/query', queryHandler);

  app.post('/referral-validation', referralValidationHandler);

  app.post('/referral-add', referralAddHandler);

  app.post('/referral-approval', referralApprovalHandler);

  app.post('/sent-first-driver-letter-to-bolt', sentFirstDriverLetterToBolt);
  app.use('/bolt', boltRouter);

  app.listen(3000, process.env.API_HOST, () => {
    console.log(`Server is running on address: ${process.env.API_HOST}:3000`);
  });

  console.log({
    message: 'Express listening',
    time: new Date(),
  });
}
