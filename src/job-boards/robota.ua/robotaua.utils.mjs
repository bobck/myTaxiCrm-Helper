import RobotaUaApiClient from './robotaua.api.mjs';

export const robotaUaAPI = await RobotaUaApiClient.initialize({
  email: process.env.ROBOTA_UA_EMAIL,
  password: process.env.ROBOTA_UA_PASSWORD,
});
export const getVacancyList = async ({ last_page }) => {
  const vacancies = [];
  let data;
  let current_page = 0;
  do {
    data = await robotaUaAPI.getVacancies({
      page: current_page,
      // vacancyStateId: 'Publicated',
      vacancyStateId: 4,
    });
    vacancies.push(...data.vacancies);
    console.log({ current_page, vacancies: data.vacancies.length });
    current_page++;
  } while (data.vacancies.length > 0);
  // const resp = await robotaUaAPI.getVacancies();
  return { vacancies };
};
export const getVacancyApplies = async ({ vacancy_id: vacancyId }) => {
  // const { applies } = await robotaUaAPI.getApplies({ vacancyId, page: 47 });
  const applies = [];
  let data;
  let current_page = 0;
  do {
    data = await robotaUaAPI.getApplies({
      vacancyId,
      page: current_page,
    });
    if (data.applies.length > 0) {
      applies.push(...data.applies);
      console.log({
        vacancyId,
        current_page,
        applies: data.applies.length,
        last_id: data.applies[0].id,
      });
      if (process.env.ENV === 'DEV' && current_page === 3) {
        return { applies };
      }
    }
    current_page++;
  } while (data.applies.length > 0);

  return { applies };
};
export const getCityList = () => robotaUaAPI.getCityValues();
