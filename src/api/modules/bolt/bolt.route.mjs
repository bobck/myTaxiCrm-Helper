import express from 'express';

import * as BoltController from './bolt.controller.mjs';
import { authorizationMiddleware } from '../../core/middleware/core.middlewares.mjs';

const lettersRouter = express.Router();

// This will handle POST requests to /bolt/letters/
lettersRouter.post('/sent/1', BoltController.handleFirstLetter);
lettersRouter.post('/sent/2', BoltController.handleSecondLetter);

lettersRouter.post(
  '/approve/:letter_id',
  BoltController.handleLetterApprovement
);

// All routes defined in lettersRouter will be prefixed with /bolt/letters
const boltRouter = express.Router();
boltRouter.use(authorizationMiddleware);
boltRouter.use('/letters', lettersRouter);


export default boltRouter;
