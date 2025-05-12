// ./modules/bolt/bolt.router.mjs
import express from 'express';

import { sentFirstDriverLetterToBolt } from '../modules/sentFirstDriverLetterToBoltHandler.mjs';
import { approveBoltDriverBanHandler } from '../modules/approveBoltDriverBanHandler.mjs';
import { approveDriverLetterToBoltHandler } from '../modules/approveDriverLetterToBoltHandler.mjs';
import { approveSecondDriverLetterToBoltHandler } from '../modules/approveSecondDriverLetterToBoltHandler.mjs';
import { boltAuthorizationMiddleware } from '../middleware/bolt.middlewares.mjs';

const boltRouter = express.Router();
const lettersRouter = express.Router();
const banConfirmRouter = express.Router();
boltRouter.use(boltAuthorizationMiddleware);

// This will handle POST requests to /bolt/letters/
lettersRouter.post('/sent/first', sentFirstDriverLetterToBolt);
lettersRouter.post('/sent/second', (req, res) => {
  res.status(200).json({ message: 'Second letter sent' });
});

lettersRouter.post('/approve/:letter_id', approveDriverLetterToBoltHandler);

banConfirmRouter.post('/confirmBan', approveBoltDriverBanHandler);

// All routes defined in lettersRouter will be prefixed with /bolt/letters

boltRouter.use('/letters', lettersRouter);
boltRouter.use('/ban', banConfirmRouter);

export default boltRouter;
