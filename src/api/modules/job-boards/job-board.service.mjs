import { createBitrixVacancy } from '../../../job-boards/job-board.queries.mjs';
import { getRobotaUaVacancyById } from '../../../job-boards/robota.ua/robotaua.utils.mjs';
import { getWorkUaVacancyById } from '../../../job-boards/work.ua/workua.utils.mjs';
import * as jobBoardRepo from './job-board.repo.mjs';
/**
 * 
 * `CREATE TABLE bitrix_vacancies_to_job_board_vacancies (
    vacancy_name TEXT,
    bitrix_vacancy_id INTEGER,
    work_ua_vacancy_id INTEGER,
    robota_ua_vacancy_id INTEGER,
    is_active BOOLEAN DEFAULT FALSE,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (bitrix_vacancy_id)
    )`
 */
export const activateVacancy = async ({ query }) => {
  console.log({ query });
  const {
    bitrix_vacancy_id,
    vacancy_name,
    work_ua_vacancy_id,
    robota_ua_vacancy_id,
  } = query;
  const { vacancy } = await jobBoardRepo.getExistingVacancy({
    bitrix_vacancy_id,
  });
  if (vacancy) {
    return 'vacancy already exist';
  }

  // const robotaUaVacancy = await getRobotaUaVacancyById({
  //   vacancyId: robota_ua_vacancy_id,
  // });
  // console.log(robotaUaVacancy)
  const workUaVacancy = await getWorkUaVacancyById({
    vacancyId: work_ua_vacancy_id,
  });
  console.log(workUaVacancy)

  // await createBitrixVacancy({
  //   bitrix_vacancy_id,
  //   vacancy_name,
  //   work_ua_vacancy_id,
  //   robota_ua_vacancy_id,
  // });
  return 'vacancy created';
};

export const deactivateVacancy = async ({ query }) => {
  return 'velcome to disable vacancy';
};
