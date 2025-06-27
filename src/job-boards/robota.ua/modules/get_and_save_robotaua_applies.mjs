import { getAllActiveVacancies } from '../robotaua.queries.mjs';
import fs from 'fs';
import path from 'path';
import { getCityList, getVacancyApplies } from '../robotaua.utils.mjs';
import { createVacancyResponseCards } from '../../../bitrix/bitrix.utils.mjs';
import { assignVacancyTitleToApplies } from '../../job-boards.utils.mjs';
import { processApiResponse } from '../robotaua.business-entity.mjs';

export const getAndSaveRobotaUaVacancyApplies = async () => {
  console.log({
    module: 'getAndSaveRobotaUaVacancyApplies',
    date: new Date(),
  });
  const cities = await getCityList();
  const { activeVacancies } = await getAllActiveVacancies();
  const applies = [];
  for (const [index, vacancy] of activeVacancies.entries()) {
    // console.log(vacancy);
    const { vacancy_name, vacancy_id } = vacancy;
    const { applies: _applies } = await getVacancyApplies({ vacancy_id });
    applies.push(
      ...assignVacancyTitleToApplies({ applies: _applies, title: vacancy_name })
      .map((city)=>{}
      )
    );

    if (index === 0) {
      break;
    }
  }
  console.log(applies);
  // processApiResponse
  // const processedApplies = applies.map(processApiResponse);
  // console.log(processedApplies);
  return;
  console.log(await createVacancyResponseCards({ dtos: processedApplies }));
};

if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  // await getAndSaveRobotaUaVacancies();
  await getAndSaveRobotaUaVacancyApplies();
}
