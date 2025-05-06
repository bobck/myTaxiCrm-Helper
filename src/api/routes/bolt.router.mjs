// ./modules/bolt/bolt.router.mjs
import express from 'express';

import { sentFirstDriverLetterToBolt } from '../modules/sentFirstDriverLetterToBoltHandler.mjs';
const boltRouter = express.Router();
const lettersRouter = express.Router();
const approveRouter = express.Router();
const banConfirmRouter = express.Router();

// This will handle POST requests to /bolt/letters/
lettersRouter.post('/sent/first', sentFirstDriverLetterToBolt);
lettersRouter.post('/sent/second', (req, res) => {
  res.status(200).json({ message: 'Second letter sent' });
});

lettersRouter.post('/approve/first', (req, res) => {
  res.status(200).json({ message: 'Approved' });
});
lettersRouter.post('/approve/second', (req, res) => {
  res.status(200).json({ message: 'Approved' });
});

banConfirmRouter.post('/confirmBan', (req, res) => {
  res.status(200).json({ message: 'Ban confirmed' });
});

// All routes defined in lettersRouter will be prefixed with /bolt/letters

boltRouter.use('/letters', lettersRouter);
boltRouter.use('/ban', banConfirmRouter);

export default boltRouter;
