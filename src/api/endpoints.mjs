import express from 'express';
import { queryHandler } from './modules/queryHandler.mjs';
import {
  referralAddHandler,
  referralValidationHandler,
  referralApprovalHandler,
} from './modules/referralHandlers.mjs';
import { sentFirstDriverLetterToBolt } from './modules/sentFirstDriverLetterToBoltHandler.mjs';
import boltRouter from './routes/bolt.router.mjs';
import rootRouter from './routes/root.router.mjs';
export async function initApi() {
  const app = express();
  app.use(express.json());
  app.use('/', rootRouter);
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

if (process.env.ENV === 'DEV' || process.env.ENV === 'PROD') {
  initApi();
}
