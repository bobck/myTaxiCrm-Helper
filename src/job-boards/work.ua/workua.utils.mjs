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
export const getResponsesByVacancyId = async ({ vacancyId, _responses }) => {
  if (!_responses) {
    _responses = [];
  }
  const { responses } = await workUaAPI.getVacancyResponses(vacancyId);
  return { responses };
};
export const getAllResponses = async ({ last_id } = { last_id: 0 }) => {
  const options = {
    sort: 0,
    limit: 50,
    last_id,
  };
  const { data } = await workUaAPI.getResponses(options);
  const { items: responses } = data;
  return { responses };
};
export const checkJobs = async () => {
  return workUaAPI.token;
  //   return await workUaAPI.checkLoginAndGetJobs();
};
