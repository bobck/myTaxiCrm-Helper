import express from 'express';

import * as jobBoardController from './job-board.controller.mjs';

const jobBoardRouter = express.Router();
const vacancyRoute = express.Router();

vacancyRoute.post('/add-update', jobBoardController.addOrUpdateVacancyEndpoint);

vacancyRoute.post('/activate', jobBoardController.activateVacancyEndpoint);

vacancyRoute.post('/deactivate', jobBoardController.deactivateVacancyEndpoint);

vacancyRoute.post('/dev',jobBoardController.devEndpoint)

jobBoardRouter.use('/vacancies', vacancyRoute);

export default jobBoardRouter;
