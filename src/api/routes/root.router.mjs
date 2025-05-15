import express from 'express';
const rootHandler = (req, res) => {
  const { ip } = req;
  res.send(`Hey ${ip}!\nWelcome to the myTaxiCrm-Helper API!`);
};
const rootRouter = express.Router();

rootRouter.use('/', rootHandler);

export default rootRouter;
