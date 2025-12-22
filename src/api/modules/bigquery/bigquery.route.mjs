import express from 'express';
import * as BigQueryController from './bigquery.controller.mjs';
import { authorizationMiddleware } from '../../core/middleware/core.middlewares.mjs';

const remonline = express.Router();

// This will handle POST requests to /remonline/orders/products/prices
remonline.post(
  '/orders/products/prices',
  BigQueryController.forceUpdateRemonlineOrderProductPrices
);

const bigQueryRouter = express.Router();
bigQueryRouter.use(authorizationMiddleware);
bigQueryRouter.use('/remonline', remonline);

export default bigQueryRouter;
