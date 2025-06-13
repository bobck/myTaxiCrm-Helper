import { getVacancyList, getVanacyApplies } from '../robotaua.utils.mjs';

export const getAndSaveRobotaUaVacancies = async () => {
  console.log({
    module: 'getAndSaveRobotaUaVacancies',
    date: new Date(),
  });
 
};

if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  await getAndSaveRobotaUaVacancies();
}
