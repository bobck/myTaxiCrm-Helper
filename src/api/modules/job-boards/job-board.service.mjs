import { vacancyRequestTypeId } from '../../../bitrix/bitrix.constants.mjs';
import { addCommentToEntity } from '../../../bitrix/bitrix.utils.mjs';
import {
  createBitrixVacancy,
  updateBitrixVacancy,
} from '../../../job-boards/job-board.queries.mjs';
import { markRobotaUaVacancyAsActive } from '../../../job-boards/robota.ua/robotaua.queries.mjs';
import {
  activateRobotaUaVacancy,
  getRobotaUaVacancyById,
} from '../../../job-boards/robota.ua/robotaua.utils.mjs';
import { markWorkUaVacancyAsActive } from '../../../job-boards/work.ua/workua.queries.mjs';
import {
  activateWorkUaVacancy,
  getWorkUaVacancyById,
} from '../../../job-boards/work.ua/workua.utils.mjs';
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
  if (robota_ua_vacancy_id) {
    const robotaUaVacancy = await getRobotaUaVacancyById({
      vacancyId: robota_ua_vacancy_id,
    });
    if (!robotaUaVacancy && robota_ua_vacancy_id) {
      const comment = `Вакансія robota.ua id: ${robota_ua_vacancy_id} не знайдена`;
      // await addCommentToEntity({
      //   entityId: bitrix_vacancy_id,
      //   typeId: vacancyRequestTypeId,
      //   comment,
      // });
    }
  }
  if (work_ua_vacancy_id) {
    const workUaVacancy = await getWorkUaVacancyById({
      vacancyId: work_ua_vacancy_id,
    });
    if (!workUaVacancy) {
      const comment = `Вакансія work.ua id: ${work_ua_vacancy_id} не знайдена`;
      // await addCommentToEntity({
      //   entityId: bitrix_vacancy_id,
      //   typeId: vacancyRequestTypeId,
      //   comment,
      // });
    }
  }

  // await createBitrixVacancy({
  //   bitrix_vacancy_id,
  //   vacancy_name,
  //   work_ua_vacancy_id,
  //   robota_ua_vacancy_id,
  // });
};
const updateVacancy = async ({
  bitrix_vacancy_id,
  vacancy_name,
  work_ua_vacancy_id,
  robota_ua_vacancy_id,
}) => {
  await updateBitrixVacancy({
    bitrix_vacancy_id,
    vacancy_name,
    work_ua_vacancy_id,
    robota_ua_vacancy_id,
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
    await addVacancy({
      bitrix_vacancy_id,
      vacancy_name,
      work_ua_vacancy_id,
      robota_ua_vacancy_id,
    });
  }
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
