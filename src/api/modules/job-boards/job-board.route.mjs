import express from 'express';

import * as jobBoardController from './job-board.controller.mjs';
import {
  authorizationMiddleware,
  loggerMiddleware,
} from '../../core/middleware/core.middlewares.mjs';

const jobBoardRouter = express.Router();
const vacancyRoute = express.Router();

vacancyRoute.post('/add-update', jobBoardController.addOrUpdateVacancyEndpoint);

vacancyRoute.post('/activate', jobBoardController.activateVacancyEndpoint);

vacancyRoute.post('/deactivate', jobBoardController.deactivateVacancyEndpoint);

jobBoardRouter.use(loggerMiddleware);
jobBoardRouter.use(authorizationMiddleware);

jobBoardRouter.use('/vacancies', vacancyRoute);

export default jobBoardRouter;
