import { processApiResponse } from '../robotaua.business-entity.mjs';
import { getVacancyList, getVacancyApplies } from '../robotaua.utils.mjs';



export const getAndSaveRobotaUaVacancies = async () => {
  console.log({
    module: 'getAndSaveRobotaUaVacancies',
    date: new Date(),
  });
  const { applies } = await getVacancyApplies();
 
  const processedApplies = applies.map(processApiResponse);
  console.log(processedApplies);

};

if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  await getAndSaveRobotaUaVacancies();
}
