import { createVacancyResponseCards } from '../../../bitrix/bitrix.utils.mjs';
import { processApiResponse } from '../robotaua.business-entity.mjs';
import {
  createVacancy,
  getAllVacancyIds,
  markManyVacanciesAsDeleted,
  markVacancyAsDeleted,
} from '../robotaua.queries.mjs';
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
  const existingVacancyIds = (await getAllVacancyIds()).map(
    (item) => item.vacancy_id
  );
  const page = parseInt(existingVacancyIds.length / 20);
  const { vacancies } = await getVacancyList({ last_page: page });
  vacancies.pop();
  vacancies.pop();
  vacancies.pop();
  vacancies.pop();
  const newVacancies = vacancies.filter(
    (vacancy) => !existingVacancyIds.includes(vacancy.vacancyId)
  );
  const deletedVacancies = existingVacancyIds.filter(
    (vacancyId) => !vacancies.find((vacancy) => vacancy.vacancyId === vacancyId)
  );
  console.log({ page, existingVacanies: existingVacancyIds.length });
  console.log({ newVacancies: newVacancies.length });
  console.log({ deletedVacancies: deletedVacancies.length });

  for (const vacancy of newVacancies) {
    const { vacancyId, vacancyName, vacancyDate } = vacancy;
    console.log({ vacancyId, vacancyName, vacancyDate });
    await createVacancy({
      vacancy_id: vacancyId,
      vacancy_name: vacancyName,
      vacancy_date: vacancyDate,
    });
  }
  await markManyVacanciesAsDeleted({ vacancy_ids: deletedVacancies });

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
