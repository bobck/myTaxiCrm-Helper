import { getAllActiveVacancies } from '../robotaua.queries.mjs';
import fs from 'fs';
import path from 'path';
import { getVacancyApplies } from '../robotaua.utils.mjs';

export const getAndSaveRobotaUaVacancyApplies = async () => {
  console.log({
    module: 'getAndSaveRobotaUaVacancyApplies',
    date: new Date(),
  });
  const { activeVacancies } = await getAllActiveVacancies();
  for (const vacancy of activeVacancies) {
    // console.log(vacancy);

    const { applies } = await getVacancyApplies(vacancy);
    console.log(applies)
    return;
  }
  //   return;

  const processedApplies = applies.map(processApiResponse);
  // console.log(processedApplies)
  // console.log(await createVacancyResponseCards({ dtos: processedApplies }));
};

if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  // await getAndSaveRobotaUaVacancies();
  await getAndSaveRobotaUaVacancyApplies();
}
