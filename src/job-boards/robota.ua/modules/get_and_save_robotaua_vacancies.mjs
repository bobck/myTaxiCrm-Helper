import { createVacancyResponseCards } from '../../../bitrix/bitrix.utils.mjs';
import { processApiResponse } from '../robotaua.business-entity.mjs';
import {
  getVacancyList,
  getVacancyApplies,
  robotaUaAPI,
} from '../robotaua.utils.mjs';

export const getAndSaveRobotaUaVacancies = async () => {
  console.log({
    module: 'getAndSaveRobotaUaVacancies',
    date: new Date(),
  });
  const { vacancies } = await getVacancyList();

  
  for (const vacancy of vacancies) {
    const { vacancyId, vacancyName } = vacancy;
    // console.log({ vacancyId, vacancyName });
    const { applies } = await getVacancyApplies({ vacancyId});
    // console.log(applies[0]);
    break;
  }

  //https://robota.ua/my/vacancies/9414972/applies?id=27838157-empty
  //https://robota.ua/my/vacancies/9414972/applies?id=7973901-prof

  //https://robota.ua/my/vacancies/8997804/applies?id=17283895-prof
  return;
  const processedApplies = applies.map(processApiResponse);
  // console.log(processedApplies)
  // console.log(await createVacancyResponseCards({ dtos: processedApplies }));
};

if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  await getAndSaveRobotaUaVacancies();

  // const a = await robotaUaAPI.getResume({ resumeId: 24583573 });
  // console.log({a})
}
