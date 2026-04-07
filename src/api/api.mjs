import express from 'express';

import coreRouter from './core/core.route.mjs';

export async function initApi() {
  try {
    const app = express();
    app.use(express.json());

    app.use('/', coreRouter);
    app.listen(3000, process.env.API_HOST, () => {
      console.log(`Server is running on address: ${process.env.API_HOST}:3000`);
    });

    console.log({
      message: 'Express listening',
      time: new Date(),
    });
  } catch (e) {
    console.error(e, 'unknown error appeared. restaring API...');
  }
}
if (process.env.ENV === 'DEV' || process.env.ENV === 'PROD') {
  initApi();
}
