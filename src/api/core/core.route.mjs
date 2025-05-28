import express from 'express';

const coreRouter = express.Router();

coreRouter.use('/',(req, res) => {
  const { ip } = req;
  res.send(`Hey ${ip}!\nWelcome to the myTaxiCrm-Helper API!`);
});

export default coreRouter;


