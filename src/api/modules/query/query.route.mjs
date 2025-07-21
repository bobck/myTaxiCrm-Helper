import express from 'express';
import * as QueryController from './query.controller.mjs';
import { authorizationMiddleware } from '../../core/middleware/core.middlewares.mjs';
const queryRouter = express.Router();

queryRouter.use('/',authorizationMiddleware)
queryRouter.post('/', QueryController.queryHandler);

export default queryRouter;
