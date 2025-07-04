import { createVacancyResponseCards } from '../../../bitrix/bitrix.utils.mjs';
import { processApiResponse } from '../robotaua.business-entity.mjs';
import { robotaUaCities } from '../robotaua.constants.mjs';
import {
  createVacancy,
  getAllUniqueRobotaUaCityIds,
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
  const existingVacancyIds = (await getAllVacancyIds()).map(
    (item) => item.vacancy_id
  );
  // const existingVacancyIds = [];
  const page = parseInt(existingVacancyIds.length / 20);
  const { vacancies } = await getVacancyList({ last_page: page });

  console.log({ vacancies: vacancies.length });

  const newVacancies = vacancies.filter(
    (vacancy) => !existingVacancyIds.includes(vacancy.vacancyId)
  );
  const deletedVacancies = existingVacancyIds.filter(
    (vacancyId) => !vacancies.find((vacancy) => vacancy.vacancyId === vacancyId)
  );

  for (const vacancy of newVacancies) {
    const { vacancyId, vacancyName, vacancyDate, cityId } = vacancy;
    // console.log({ vacancyId, vacancyName, vacancyDate });
    await createVacancy({
      vacancy_id: vacancyId,
      vacancy_name: vacancyName,
      vacancy_date: vacancyDate,
      robota_ua_city_id: cityId,
    });
  }
  await markManyVacanciesAsDeleted({ vacancy_ids: deletedVacancies });
  console.log({
    module: 'getAndSaveRobotaUaVacancies',
    date: new Date(),
    newVacancies: newVacancies.length,
    deletedVacancies: deletedVacancies.length,
  });
  return;
  const processedApplies = applies.map(processApiResponse);
  // console.log(processedApplies)
  // console.log(await createVacancyResponseCards({ dtos: processedApplies }));
};

if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  // await getAndSaveRobotaUaVacancies();
  const cityIds = (await getAllUniqueRobotaUaCityIds()).map(
    (city) => city.robota_ua_city_id
  );
  const presentCities = robotaUaCities.filter((city) =>
    cityIds.includes(city.id)
  );
  console.log(presentCities);
}
