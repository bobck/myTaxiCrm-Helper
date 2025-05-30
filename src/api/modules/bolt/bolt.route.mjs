import express from 'express';

import { boltAuthorizationMiddleware } from './middleware/bolt.middlewares.mjs';
import * as BoltController from './bolt.controller.mjs';

const lettersRouter = express.Router();

// This will handle POST requests to /bolt/letters/
lettersRouter.post('/sent/1', BoltController.handleFirstLetter);
lettersRouter.post('/sent/2', BoltController.handleSecondLetter);

lettersRouter.post(
  '/approve/:letter_id',
  BoltController.handleLetterApprovement
);

const banRouter = express.Router();
banRouter.post('/confirmBan', BoltController.handleBanApprovement);

// All routes defined in lettersRouter will be prefixed with /bolt/letters
const boltRouter = express.Router();
boltRouter.use(boltAuthorizationMiddleware);
boltRouter.use('/letters', lettersRouter);
boltRouter.use('/ban', banRouter);

export default boltRouter;
