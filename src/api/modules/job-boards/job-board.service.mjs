import { vacancyRequestTypeId } from '../../../bitrix/bitrix.constants.mjs';
import { addCommentToEntity } from '../../../bitrix/bitrix.utils.mjs';
import {
  createBitrixVacancy,
  updateBitrixVacancy,
} from '../../../job-boards/job-board.queries.mjs';
import {
  markRobotaUaVacancyAsActive,
  updateVacancyProgress,
} from '../../../job-boards/robota.ua/robotaua.queries.mjs';
import {
  activateRobotaUaVacancy,
  getRobotaUaVacancyById,
} from '../../../job-boards/robota.ua/robotaua.utils.mjs';
import { markWorkUaVacancyAsActive } from '../../../job-boards/work.ua/workua.queries.mjs';
import {
  activateWorkUaVacancy,
  getWorkUaVacancyById,
} from '../../../job-boards/work.ua/workua.utils.mjs';
import { getRobotaAndWokUaVacanciesById } from './job-board.buisness-entity.mjs';
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

const addVacancy = async ({
  bitrix_vacancy_id,
  vacancy_name,
  work_ua_vacancy_id,
  robota_ua_vacancy_id,
}) => {
  const { workUaVacancy, robotaUaVacancy } =
    await getRobotaAndWokUaVacanciesById({
      work_ua_vacancy_id,
      robota_ua_vacancy_id,
    });
  const payload = {};
  if (workUaVacancy) {
    payload.work_ua_vacancy_id = workUaVacancy.id;
  }
  if (robotaUaVacancy) {
    payload.robota_ua_vacancy_id = robotaUaVacancy.id;
  }

  jobBoardRepo.addVacancySynchronously({
    bitrix_vacancy_id,
    vacancy_name,
    is_active: false,
    ...payload,
  });
};
const updateVacancy = async ({
  bitrix_vacancy_id,
  vacancy_name,
  work_ua_vacancy_id,
  robota_ua_vacancy_id,
}) => {
  const { workUaVacancy, robotaUaVacancy } =
    await getRobotaAndWokUaVacanciesById({
      work_ua_vacancy_id,
      robota_ua_vacancy_id,
    });
  const payload = {};
  if (workUaVacancy) {
    payload.work_ua_vacancy_id = workUaVacancy.id;
  }
  if (robotaUaVacancy) {
    payload.robota_ua_vacancy_id = robotaUaVacancy.id;
  }

  jobBoardRepo.updateVacancySynchronously({
    bitrix_vacancy_id,
    vacancy_name,
    is_active: false,
    ...payload,
  });
};
export const add_update_vacancy_fork = async ({ query }) => {
  const {
    bitrix_vacancy_id,
    vacancy_name,
    work_ua_vacancy_id,
    robota_ua_vacancy_id,
  } = query;
  const { vacancy } = await jobBoardRepo.getExistingVacancy({
    bitrix_vacancy_id,
  });
  if (!vacancy) {
    return await addVacancy({
      bitrix_vacancy_id,
      vacancy_name,
      work_ua_vacancy_id,
      robota_ua_vacancy_id,
    });
  }
  return await updateVacancy({
    bitrix_vacancy_id,
    vacancy_name,
    work_ua_vacancy_id,
    robota_ua_vacancy_id,
  });
};
export const activateVacancy = async ({ query }) => {
  console.log({ query });
  const { bitrix_vacancy_id } = query;
  const { vacancy } = await jobBoardRepo.getExistingVacancy({
    bitrix_vacancy_id,
  });
  const { work_ua_vacancy_id, robota_ua_vacancy_id } = vacancy;
  if (robota_ua_vacancy_id) {
    await activateRobotaUaVacancy({ vacancyId: robota_ua_vacancy_id });
    await markRobotaUaVacancyAsActive(vacancy);
  }
  if (work_ua_vacancy_id) {
    await activateWorkUaVacancy({ vacancyId: work_ua_vacancy_id });
    await markWorkUaVacancyAsActive(vacancy);
  }
  return 'vacancy created';
};

export const deactivateVacancy = async ({ query }) => {
  return 'velcome to disable vacancy';
};
