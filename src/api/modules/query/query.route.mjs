import express from 'express';
import * as QueryController from './query.controller.mjs';
const queryRouter = express.Router();

queryRouter.post('/', QueryController.queryHandler);

export default queryRouter;
