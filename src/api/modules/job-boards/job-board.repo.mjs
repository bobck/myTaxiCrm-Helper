import {
  createBitrixVacancy,
  getVacancyById,
  updateBitrixVacancy,
} from '../../../job-boards/job-board.queries.mjs';
import {
  createRobotaUaSynchronizedVacancy,
  updateRobotaUaSynchronizedVacancy,
} from '../../../job-boards/robota.ua/robotaua.queries.mjs';
import {
  createWorkUaSynchronizedVacancy,
  updateWorkUaSynchronizedVacancy,
} from '../../../job-boards/work.ua/workua.queries.mjs';

export const getExistingVacancy = async ({ bitrix_vacancy_id }) => {
  const vacancy = await getVacancyById({ bitrix_vacancy_id });
  // console.log(vacancy);

  return { vacancy };
};
export const createVacancySynchronously = async ({
  bitrix_vacancy_id,
  vacancy_name,
  work_ua_vacancy_id,
  robota_ua_vacancy_id,
  is_active,
}) => {
  console.log({
    message: 'creating vacancy',
    bitrix_vacancy_id,
    vacancy_name,
  });
  await createBitrixVacancy({
    bitrix_vacancy_id,
    vacancy_name,
    work_ua_vacancy_id,
    robota_ua_vacancy_id,
    is_active,
  });
  if (robota_ua_vacancy_id) {
    await createRobotaUaSynchronizedVacancy({
      bitrix_vacancy_id,
      robota_ua_vacancy_id,
      is_active,
    });
  }
  if (work_ua_vacancy_id) {
    await createWorkUaSynchronizedVacancy({
      bitrix_vacancy_id,
      work_ua_vacancy_id,
      is_active,
    });
  }
};
export const updateVacancySynchronously = async ({
  bitrix_vacancy_id,
  vacancy_name,
  work_ua_vacancy_id,
  robota_ua_vacancy_id,
  is_active,
}) => {
  console.log({
    message: 'updating vacancy',
    bitrix_vacancy_id,
    vacancy_name,
  });
  await updateBitrixVacancy({
    bitrix_vacancy_id,
    vacancy_name,
    work_ua_vacancy_id,
    robota_ua_vacancy_id,
    is_active,
  });
  if (robota_ua_vacancy_id) {
    await updateRobotaUaSynchronizedVacancy({
      bitrix_vacancy_id,
      robota_ua_vacancy_id,
      is_active,
    });
  }
  if (work_ua_vacancy_id) {
    await updateWorkUaSynchronizedVacancy({
      bitrix_vacancy_id,
      work_ua_vacancy_id,
      is_active,
    });
  }
};
