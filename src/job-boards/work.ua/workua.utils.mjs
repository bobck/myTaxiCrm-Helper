import WorkUaApiClient from './workua.api.mjs';

const workUaAPI = new WorkUaApiClient({
  email: process.env.WORK_UA_EMAIL,
  password: process.env.WORK_UA_PASSWORD,
});
export const getVacancies = async (
  { full, all, active } = { full: 1, all: 1, active: 1 }
) => {
  const { items: vacancies } = await workUaAPI.getVacancies({
    full,
    all,
    active,
  });
  return { vacancies };
};
export const getVacancyIds = async () => {
  const { items: vacancies } = await workUaAPI.getVacancies({
    full: 0,
    all: 1,
    active: 1,
  });
  const vacancyIds = vacancies.map((vacancy) => Number(vacancy.id));
  return { vacancyIds };
};

export const checkJobs = async () => {
  return workUaAPI.token;
  //   return await workUaAPI.checkLoginAndGetJobs();
};
