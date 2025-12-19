import { devLog } from '../../shared/shared.utils.mjs';
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

export const getRobotaUaVacancyApplies = async ({
  robota_ua_vacancy_id,
  last_apply_date,
}) => {
  const applies = [];
  let data;
  let current_page = 0;
  const targetDate = new Date(last_apply_date ?? 0);
  devLog(targetDate);
  let theOldestApplyDate;
  do {
    data = await robotaUaAPI.getApplies({
      vacancyId: robota_ua_vacancy_id,
      page: current_page,
    });

    applies.push(...data.applies);

    const { addDate: theOldestApplyDateStringified } =
      applies[applies.length - 1];
    theOldestApplyDate = new Date(theOldestApplyDateStringified);

    current_page++;
    devLog({
      theOldestApplyDate,
      current_page,
      applies: data.applies.length,
    });
  } while (theOldestApplyDate > targetDate);

  const filteredAppliesByDate = applies.filter(
    (apply) => new Date(apply.addDate) > targetDate
  );

  return { applies: filteredAppliesByDate };
};
export const getRobotaUaVacancyById = async ({
  robota_ua_vacancy_id: vacancyId,
}) => {
  try {
    return await robotaUaAPI.getVacancyById({ vacancyId });
  } catch (e) {
    return null;
  }
};
export const checkIfRobotaUaVacancyStaysActive = async ({
  robota_ua_vacancy_id: vacancyId,
}) => {
  const { state } = await getRobotaUaVacancyById({
    robota_ua_vacancy_id: vacancyId,
  });
  const is_active = state === 'Publicated';
  return { is_active };
};
export const activateRobotaUaVacancy = async ({ vacancyId }) => {
  console.log({
    message: `robota.ua vacancy ${vacancyId} is being activated...`,
  });
  await robotaUaAPI.changeVacancyState({ vacancyId, state: 'Publicated' });
};
export const deactivateRobotaUaVacancy = async ({ vacancyId }) => {
  console.log({
    message: `robota.ua vacancy ${vacancyId} is being activated...`,
  });
  await robotaUaAPI.changeVacancyState({ vacancyId, state: 'Closed' });
};
export const changeRobotaUaVacancyPublicationType = async ({
  robotaUaVacancy,
  robota_ua_publication_type,
}) => {
  devLog({
    robota_ua_vacancy_id: robotaUaVacancy.vacancyId,
    robota_ua_publication_type,
  });
  const resp = await robotaUaAPI.changeVacancyPublicationType({
    vacancy: robotaUaVacancy,
    publishType: robota_ua_publication_type,
  });
  return resp;
};
export const getRobotaUaPublicationLeftOvers = async ({ page }) => {
  return await robotaUaAPI.getPublicationLeftOvers({ page });
};

export const getRobotaUaTicketRest = async ({ ticketType }) =>
  await robotaUaAPI.getTicketRest({ ticketType });
/**
 * Cold sources candidates with pagination and ID filtration.
 * @param {Object} searchParams - The search criteria (keyWords, cityId, etc.)
 * @param {Array<number|string>} excludeIds - Array of Resume IDs to exclude
 * @param {number} limit - Target number of unique candidates to find
 * @param {number} maxPages - Safety limit for pages to fetch
 */
export const coldSourceRobotaUaByTerm = async (
  searchParams,
  excludeIds = [],
  limit = 20,
  maxPages = 50
) => {
  const auth = {
    email: process.env.ROBOTA_UA_EMAIL,
    password: process.env.ROBOTA_UA_PASSWORD,
  };

  const client = await RobotaUaApiClient.initialize(auth);

  let allCandidates = [];
  let page = 0;
  let hasMore = true;
  const pageSize = searchParams.count || 20;

  devLog(
    `Starting Cold Source: "${searchParams.keyWords}" (Need: ${limit}, Excluding: ${excludeIds.length} IDs)`
  );

  while (hasMore && page < maxPages && allCandidates.length < limit) {
    const currentParams = {
      period: 'ThreeDays',
      searchType: 'default',
      count: 20,
      ...searchParams,
      page,
      count: pageSize,
    };

    const response = await client.searchResumes(currentParams);
    const { documents } = response;

    if (!documents || documents.length === 0) {
      hasMore = false;
      break;
    }
    const newCandidates = documents.filter(
      (doc) => !excludeIds.includes(doc.resumeId)
    );

    if (newCandidates.length < documents.length) {
      devLog(
        `Page ${page}: Skipped ${documents.length - newCandidates.length} duplicates.`
      );
    }

    allCandidates = [...allCandidates, ...newCandidates];

    if (documents.length < pageSize) {
      hasMore = false;
    }

    page++;
  }

  const finalCandidates = allCandidates.slice(0, limit);

  return {
    documents: finalCandidates,
    totalCount: finalCandidates.length,
  };
};
