import { addCommentToEntity } from '../../../bitrix/bitrix.utils.mjs';
import {
  markRobotaUaVacancyAsActive,
  markRobotaUaVacancyAsInactive,
} from '../../../job-boards/robota.ua/robotaua.queries.mjs';
import {
  activateRobotaUaVacancy,
  deactivateRobotaUaVacancy,
} from '../../../job-boards/robota.ua/robotaua.utils.mjs';
import {
  markWorkUaVacancyAsActive,
  markWorkUaVacancyAsInactive,
} from '../../../job-boards/work.ua/workua.queries.mjs';
import {
  activateWorkUaVacancy,
  deactivateWorkUaVacancy,
} from '../../../job-boards/work.ua/workua.utils.mjs';
import {
  assignManyCommentsToVacancyRequest,
  getRobotaAndWokUaVacanciesById,
} from './job-board.buisness-entity.mjs';
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
  const comments = [];
  const {
    workUaVacancy,
    robotaUaVacancy,
    _comments: _comments1,
    isAnyVacancyFound,
  } = await getRobotaAndWokUaVacanciesById({
    work_ua_vacancy_id,
    robota_ua_vacancy_id,
    bitrix_vacancy_id,
  });
  comments.push(..._comments1);
  if (!isAnyVacancyFound) {
    comments.push('Жодної вакансії не знайдено');
    await assignManyCommentsToVacancyRequest({ comments });
    return;
  }
  const payload = {};
  if (workUaVacancy) {
    console.log({ workUaVacancy, message: 'found' });
    payload.workUaVacancy = workUaVacancy;
  }
  if (robotaUaVacancy) {
    console.log({ robotaUaVacancy, message: 'found' });
    payload.robotaUaVacancy = robotaUaVacancy;
  }

  const { _comments: _comments2, isAnyVacancyCreated } =
    await jobBoardRepo.addVacancySynchronously({
      bitrix_vacancy_id,
      vacancy_name,
      is_active: false,
      ...payload,
    });
  console.log({ _comments2, isAnyVacancyCreated });
  comments.push(..._comments2);
  if (!isAnyVacancyCreated) {
    comments.push(`Вакансія НЕ додана до системи.`);
  } else {
    comments.push(`Вакансія додана до системи.`);
  }
  await assignManyCommentsToVacancyRequest({ comments });
};
const updateVacancy = async ({
  bitrix_vacancy_id,
  vacancy_name,
  work_ua_vacancy_id,
  robota_ua_vacancy_id,
  vacancy,
}) => {
  const comments = [];
  const {
    workUaVacancy,
    robotaUaVacancy,
    _comments: _comments1,
    isAnyVacancyFound,
  } = await getRobotaAndWokUaVacanciesById({
    work_ua_vacancy_id,
    robota_ua_vacancy_id,
    bitrix_vacancy_id,
  });
  comments.push(..._comments1);
  if (!isAnyVacancyFound) {
    comments.push('Жодної вакансії не знайдено');
    await assignManyCommentsToVacancyRequest({ comments });
    return;
  }
  const payload = { vacancy };
  if (workUaVacancy) {
    payload.work_ua_vacancy_id = workUaVacancy.id;
    if (vacancy.work_ua_vacancy_id !== workUaVacancy.id) {
      await jobBoardRepo.synchronizeWorkUaVacancy({
        workUaVacancy,
        vacancy,
      });
    }
  }
  if (robotaUaVacancy) {
    payload.robota_ua_vacancy_id = robotaUaVacancy.vacancyId;
    if (vacancy.robota_ua_vacancy_id !== robotaUaVacancy.vacancyId) {
      await jobBoardRepo.synchronizeRobotaUaVacancy({
        robotaUaVacancy,
        vacancy,
      });
    }
  }

  const { isAnyVacancyUpdated, _comments: _comments2 } =
    jobBoardRepo.updateVacancySynchronously({
      bitrix_vacancy_id,
      vacancy_name,
      is_active: false,
      ...payload,
    });
  comments.push(..._comments2);
  console.log({ comments, isAnyVacancyUpdated });
  if (!isAnyVacancyUpdated) {
    comments.push(`Вакансія НЕ оновлена в системі.`);
  } else {
    comments.push(`Вакансія оновлена в системі.`);
  }
  await assignManyCommentsToVacancyRequest({ comments, bitrix_vacancy_id });
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
    vacancy,
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
  return 'vacancy activated';
};

export const deactivateVacancy = async ({ query }) => {
  console.log({ query });
  const { bitrix_vacancy_id } = query;
  const { vacancy } = await jobBoardRepo.getExistingVacancy({
    bitrix_vacancy_id,
  });
  const { work_ua_vacancy_id, robota_ua_vacancy_id } = vacancy;
  if (robota_ua_vacancy_id) {
    await deactivateRobotaUaVacancy({ vacancyId: robota_ua_vacancy_id });
    await markRobotaUaVacancyAsInactive(vacancy);
  }
  if (work_ua_vacancy_id) {
    await deactivateWorkUaVacancy({ vacancyId: work_ua_vacancy_id });
    await markWorkUaVacancyAsInactive(vacancy);
  }
  return 'velcome to disable vacancy';
};
