import express from 'express';
import queryRouter from '../modules/query/query.route.mjs';
import * as CoreController from './core.controller.mjs';
import referralRouter from '../modules/referrals/referrals.route.mjs';

import jobBoardRouter from '../modules/job-boards/job-board.route.mjs';

import boltRouter from '../modules/bolt/bolt.route.mjs';


const coreRouter = express.Router();

coreRouter.use('/bolt', boltRouter);

coreRouter.use('/query', queryRouter);
coreRouter.use('/', referralRouter);
coreRouter.use('/job-boards', jobBoardRouter);

coreRouter.use('/', CoreController.handleCore);

export default coreRouter;
