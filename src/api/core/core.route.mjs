import express from 'express';
import queryRouter from '../modules/query/query.route.mjs';
import * as CoreController from './core.controller.mjs';
import referralRouter from '../modules/referrals/referrals.route.mjs';
const coreRouter = express.Router();

coreRouter.use('/query', queryRouter);
coreRouter.use('/', referralRouter);

coreRouter.use('/', CoreController.handleCore);

export default coreRouter;
