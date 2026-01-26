import { devLog } from '../../shared/shared.utils.mjs';
import RobotaUaApiClient from './robotaua.api.mjs';

let robotaUaAPI;
try {
  robotaUaAPI = await RobotaUaApiClient.initialize({
    email: process.env.ROBOTA_UA_EMAIL,
    password: process.env.ROBOTA_UA_PASSWORD,
  });
} catch (error) {
  console.error('Failed to initialize Robota.ua API client:', error.message);
  const isAuthError =
    error.response?.status === 401 ||
    error.response?.status === 403 ||
    error.message?.includes('Authentication') ||
    error.message?.includes('Invalid credentials');

  if (isAuthError) {
    console.error(
      'Robota.ua invalid credentials detected during initialization. Robota.ua jobs will not start.'
    );
    // Create a dummy client that marks credentials as invalid
    robotaUaAPI = {
      hasInvalidCredentials: true,
      getHasInvalidCredentials: () => true,
      stopJobs: () => {
        import('../jobs/get_and_save_robotaua_applies_job.mjs')
          .then(({ getAndSaveRobotaUaVacancyAppliesJob }) => {
            if (getAndSaveRobotaUaVacancyAppliesJob.running) {
              getAndSaveRobotaUaVacancyAppliesJob.stop();
            }
          })
          .catch(() => {});
      },
    };
  } else {
    // For other errors, rethrow
    throw error;
  }
}

export { robotaUaAPI };
export const getVacancyList = async ({ last_page }) => {
  const vacancies = [];
  let data;
  let current_page = 0;
  do {
    try {
      data = await robotaUaAPI.getVacancies({
        page: current_page,
        // vacancyStateId: 'Publicated',
        vacancyStateId: 4,
      });
    } catch (error) {
      // If 401, retry once after reinitialization
      if (error?.response?.status === 401) {
        data = await robotaUaAPI.getVacancies({
          page: current_page,
          vacancyStateId: 4,
        });
      } else {
        throw error;
      }
    }
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
    try {
      data = await robotaUaAPI.getApplies({
        vacancyId: robota_ua_vacancy_id,
        page: current_page,
      });
    } catch (error) {
      // If 401, retry once after reinitialization
      if (error?.response?.status === 401) {
        data = await robotaUaAPI.getApplies({
          vacancyId: robota_ua_vacancy_id,
          page: current_page,
        });
      } else {
        throw error;
      }
    }

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
  } catch (error) {
    // If 401, retry once after reinitialization
    if (error?.response?.status === 401) {
      try {
        return await robotaUaAPI.getVacancyById({ vacancyId });
      } catch (retryError) {
        return null;
      }
    }
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
  try {
    await robotaUaAPI.changeVacancyState({ vacancyId, state: 'Publicated' });
  } catch (error) {
    // If 401, retry once after reinitialization
    if (error?.response?.status === 401) {
      await robotaUaAPI.changeVacancyState({ vacancyId, state: 'Publicated' });
    } else {
      throw error;
    }
  }
};
export const deactivateRobotaUaVacancy = async ({ vacancyId }) => {
  console.log({
    message: `robota.ua vacancy ${vacancyId} is being activated...`,
  });
  try {
    await robotaUaAPI.changeVacancyState({ vacancyId, state: 'Closed' });
  } catch (error) {
    // If 401, retry once after reinitialization
    if (error?.response?.status === 401) {
      await robotaUaAPI.changeVacancyState({ vacancyId, state: 'Closed' });
    } else {
      throw error;
    }
  }
};
export const changeRobotaUaVacancyPublicationType = async ({
  robotaUaVacancy,
  robota_ua_publication_type,
}) => {
  devLog({
    robota_ua_vacancy_id: robotaUaVacancy.vacancyId,
    robota_ua_publication_type,
  });
  try {
    const resp = await robotaUaAPI.changeVacancyPublicationType({
      vacancy: robotaUaVacancy,
      publishType: robota_ua_publication_type,
    });
    return resp;
  } catch (error) {
    // If 401, retry once after reinitialization
    if (error?.response?.status === 401) {
      const resp = await robotaUaAPI.changeVacancyPublicationType({
        vacancy: robotaUaVacancy,
        publishType: robota_ua_publication_type,
      });
      return resp;
    }
    throw error;
  }
};
export const getRobotaUaPublicationLeftOvers = async ({ page }) => {
  try {
    return await robotaUaAPI.getPublicationLeftOvers({ page });
  } catch (error) {
    // If 401, retry once after reinitialization
    if (error?.response?.status === 401) {
      return await robotaUaAPI.getPublicationLeftOvers({ page });
    }
    throw error;
  }
};

export const getRobotaUaTicketRest = async ({ ticketType }) => {
  try {
    return await robotaUaAPI.getTicketRest({ ticketType });
  } catch (error) {
    // If 401, retry once after reinitialization
    if (error?.response?.status === 401) {
      return await robotaUaAPI.getTicketRest({ ticketType });
    }
    throw error;
  }
};
