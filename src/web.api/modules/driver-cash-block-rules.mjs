import { openSShTunnel } from '../../../ssh.mjs';
import { getAllWorkingDriverIds } from '../web.api.utlites.mjs';

export const driverCashBlockRules = async () => {
  const { rows: driverIds } = await getAllWorkingDriverIds();
  console.log({
    message: 'driverCashBlockRules',
    date: new Date(),
    env: process.env.ENV,
    driverIds: driverIds.length,
  });
};

if ((process.env.ENV = 'TEST')) {
  await openSShTunnel;
  await driverCashBlockRules();
}
