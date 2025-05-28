import express from 'express';
import coreRouter from './core/core.route.mjs';

export async function initApi() {
  const app = express();
  app.use(express.json());
  app.use('/', coreRouter);

  app.listen(3000);

  console.log({
    message: 'Express listening',
    time: new Date(),
  });
}
