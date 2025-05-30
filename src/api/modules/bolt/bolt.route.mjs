import express from 'express';

import { approveDriverLetterToBoltHandler } from '../approveDriverLetterToBoltHandler.mjs';
import { approveBoltDriverBanHandler } from '../approveBoltDriverBanHandler.mjs';
import { sentFirstDriverLetterToBolt } from '../sentFirstDriverLetterToBoltHandler.mjs';
import { boltAuthorizationMiddleware } from './middleware/bolt.middlewares.mjs';
import * as BoltController from './bolt.controller.mjs';

const boltRouter = express.Router();
const lettersRouter = express.Router();
const banConfirmRouter = express.Router();
boltRouter.use(boltAuthorizationMiddleware);

// This will handle POST requests to /bolt/letters/
lettersRouter.post('/sent/1', BoltController.handleFirstLetter);
lettersRouter.post('/sent/2', BoltController.handleSecondLetter);

lettersRouter.post('/approve/:letter_id', approveDriverLetterToBoltHandler);

banConfirmRouter.post('/confirmBan', approveBoltDriverBanHandler);

// All routes defined in lettersRouter will be prefixed with /bolt/letters

boltRouter.use('/letters', lettersRouter);
boltRouter.use('/ban', banConfirmRouter);

export default boltRouter;
