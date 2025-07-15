import WorkUaApiClient from './workua.api.mjs';
import { MAX_RESPONSES_PER_REQ } from './workua.api.mjs';

const workUaAPI = new WorkUaApiClient({
  email: process.env.WORK_UA_EMAIL,
  password: process.env.WORK_UA_PASSWORD,
});
export const getAllWorkUaVacanciesFromAPI = async (
  { full, all, active } = { full: 0, all: 1, active: 1 }
) => {
  const { items: vacancies } = await workUaAPI.getVacancies({
    full,
    all,
    active,
  });
  return { vacancies };
};

export const getWorkUaVacancyResponses = async ({ vacancyId, last_id }) => {
  // console.log('start fetching');
  const allResponses = [];
  let currentLastId = last_id;
  let hasMore = true;

  while (hasMore) {
    try {
      const options = {
        limit: MAX_RESPONSES_PER_REQ,
        last_id: Number(currentLastId),
        sort: 1,
      };
      const { responses } = await workUaAPI.getVacancyResponses(
        vacancyId,
        options
      );

      if (responses && responses.length > 0) {
        allResponses.push(...responses);
        currentLastId = responses[responses.length - 1].id;

        if (responses.length === 0) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    } catch (e) {
      const { status } = e;
      if (status === 404) {
        hasMore = false;
      }
    }
  }
  return { responses: allResponses };
};
export const getWorkUaVacancyById = async ({ vacancyId }) => {
  const { items: vacancies } = await workUaAPI.getVacancies({
    full: 1,
    all: 1,
  });
  const vacancy = vacancies.find((vacancy) => vacancy.id == vacancyId);
  return { vacancy };

  // const data = await workUaAPI.getVacancyById({ vacancyId });
  // return data;
};
export const activateWorkUaVacancy = async ({ workUaVacancy }) => {
  console.log({
    message: `worku.ua vacancy ${workUaVacancy.work_ua_vacancy_id} is being activated...`,
  });
  const resp = await workUaAPI.activateVacancy({
    vacancy: workUaVacancy,
  });
  return resp;
};
export const deactivateWorkUaVacancy = async ({ vacancyId }) => {
  console.log({
    message: `worku.ua vacancy ${vacancyId} is being activated...`,
  });
};

export const getWorkUaRegions = () => {
  return workUaAPI.getDictionary({
    location: 'town',
  });
};
export const getWorkUaAvailablePublications = () =>
  workUaAPI.getAvailablePublications();
