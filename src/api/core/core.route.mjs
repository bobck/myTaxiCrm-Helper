import express from 'express';
import queryRouter from '../modules/query/query.route.mjs';
import * as CoreController from './core.controller.mjs';
import referralRouter from '../modules/referrals/referrals.route.mjs';

import jobBoardRouter from '../modules/job-boards/job-board.route.mjs';

import boltRouter from '../modules/bolt/bolt.route.mjs';
import { loggerMiddleware } from './middleware/core.middlewares.mjs';
import bigQueryRouter from '../modules/bigquery/bigquery.route.mjs';

const coreRouter = express.Router();

coreRouter.use(loggerMiddleware);
coreRouter.use('/bolt', boltRouter);

coreRouter.use('/query', queryRouter);
coreRouter.use('/', referralRouter);
coreRouter.use('/job-boards', jobBoardRouter);
coreRouter.use('/bigquery', bigQueryRouter);
coreRouter.use('/', CoreController.handleCore);

export default coreRouter;
