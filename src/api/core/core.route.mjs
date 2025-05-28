import express from 'express';
import queryRouter from '../features/query/query.route.mjs';
import * as CoreController from './core.controller.mjs';
const coreRouter = express.Router();

coreRouter.use('/query', queryRouter);

coreRouter.use('/', CoreController.handleCore);

export default coreRouter;
