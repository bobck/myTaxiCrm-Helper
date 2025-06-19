import WorkUaApiClient from './workua.api.mjs';

const workUaAPI = new WorkUaApiClient({
  email: process.env.WORK_UA_EMAIL,
  password: process.env.WORK_UA_PASSWORD,
});
export const getVacancies = async (
  { full, all, active } = { full: 0, all: 1, active: 1 }
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
// workua.utils.mjs (модифицированный для пагинации откликов)
// ... (существующий код)

export const getVacancyResponses = async ({ vacancyId, last_id }) => {
  const allResponses = [];
  let currentLastId = last_id;
  let hasMore = true;

  while (hasMore) {
    const options = {
      limit: process.env.ENV === 'DEV' ? 5 : MAX_RESPONSES_PER_REQ, // Для DEV можно уменьшить лимит
      last_id: currentLastId,
    };
    const { responses } = await workUaAPI.getVacancyResponses(
      vacancyId,
      options
    );

    if (responses && responses.length > 0) {
      allResponses.push(...responses);
      currentLastId = responses[responses.length - 1].id;
      // Если количество полученных ответов меньше лимита, значит, это последняя страница
      if (responses.length < options.limit) {
        hasMore = false;
      }
    } else {
      hasMore = false; // Нет больше откликов
    }

    // Если в режиме DEV, можно ограничить количество итераций для тестирования
    if (process.env.ENV === 'DEV' && allResponses.length > 50) {
      // Пример: остановить после 50 откликов в DEV
      hasMore = false;
    }
  }
  return { responses: allResponses };
};

// ... (остальной код)
