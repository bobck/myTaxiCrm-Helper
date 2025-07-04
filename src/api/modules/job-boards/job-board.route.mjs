import express from 'express';

import * as jobBoardController from './job-board.controller.mjs';

const jobBoardRouter = express.Router();
const vacancyRoute = express.Router();

vacancyRoute.post('/activate', jobBoardController.activateVacancyEndpoint);

vacancyRoute.post('/deactivate', jobBoardController.deactivateVacancyEndpoint);

jobBoardRouter.use('/vacancies', vacancyRoute);

export default jobBoardRouter;
