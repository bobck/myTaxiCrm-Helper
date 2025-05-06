// ./modules/bolt/bolt.router.mjs
import express from 'express';

import { sentFirstDriverLetterToBolt } from '../modules/sentFirstDriverLetterToBoltHandler.mjs';
const boltRouter = express.Router();
const lettersRouter = express.Router();

// This will handle POST requests to /bolt/letters/
lettersRouter.post('/sent/first', sentFirstDriverLetterToBolt);

// All routes defined in lettersRouter will be prefixed with /bolt/letters
boltRouter.use('/letters', lettersRouter);

export default boltRouter;
