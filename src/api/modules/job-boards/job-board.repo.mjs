import { getVacancyById } from '../../../job-boards/job-board.queries.mjs';
import { createRobotaUaSynchronizedVacancy } from '../../../job-boards/robota.ua/robotaua.queries.mjs';
import { createWorkUaSynchronizedVacancy } from '../../../job-boards/work.ua/workua.queries.mjs';

export const getExistingVacancy = async ({ bitrix_vacancy_id }) => {
  const vacancy = await getVacancyById({ bitrix_vacancy_id });
  console.log(vacancy);

  return { vacancy };
};
export const createSynchronizedVacancy = async ({
  bitrix_vacancy_id,
  vacancy_name,
  work_ua_vacancy_id,
  robota_ua_vacancy_id,
}) => {
  console.log({
    message: 'creating vacancy',
    bitrix_vacancy_id,
    vacancy_name,
  });
  await createRobotaUaSynchronizedVacancy({
    bitrix_vacancy_id,
    robota_ua_vacancy_id,
    is_active: true,
  });
  await createWorkUaSynchronizedVacancy({
    bitrix_vacancy_id,
    work_ua_vacancy_id,
    is_active: true,
  });
};
