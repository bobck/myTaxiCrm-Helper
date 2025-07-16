import { devLog } from '../../../shared/shared.utils.mjs';
import { updateRobotaUaVacancyActivityState } from '../../../job-boards/robota.ua/robotaua.queries.mjs';
import {
  activateRobotaUaVacancy,
  deactivateRobotaUaVacancy,
} from '../../../job-boards/robota.ua/robotaua.utils.mjs';
import {
  updateWorkUaVacancyActivityState,
  updateWorkUaVacancyPublicationType,
} from '../../../job-boards/work.ua/workua.queries.mjs';
import {
  activateWorkUaVacancy,
  deactivateWorkUaVacancy,
  getWorkUaAvailablePublications,
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
  work_ua_publication_type,
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
  devLog({ workUaVacancy, robotaUaVacancy });

  comments.push(..._comments1);
  if (!isAnyVacancyFound) {
    comments.push('Жодної вакансії не знайдено');
    await assignManyCommentsToVacancyRequest({ comments, bitrix_vacancy_id });
    return;
  }
  const payload = {};
  if (workUaVacancy) {
    // console.log({ workUaVacancy, message: 'found' });
    payload.workUaVacancy = workUaVacancy;
    payload.work_ua_publication_type = work_ua_publication_type;
  }
  if (robotaUaVacancy) {
    // console.log({ robotaUaVacancy, message: 'found' });
    payload.robotaUaVacancy = robotaUaVacancy;
  }

  const { _comments: _comments2, isAnyVacancyCreated } =
    await jobBoardRepo.addVacancySynchronously({
      bitrix_vacancy_id,
      vacancy_name,
      is_active: false,
      ...payload,
    });
  // console.log({ _comments2, isAnyVacancyCreated });
  comments.push(..._comments2);
  if (!isAnyVacancyCreated) {
    comments.push(`Вакансія НЕ додана до системи.`);
  } else {
    comments.push(`Вакансія додана до системи.`);
  }
  await assignManyCommentsToVacancyRequest({ comments, bitrix_vacancy_id });
};
const updateVacancy = async ({
  bitrix_vacancy_id,
  vacancy_name,
  work_ua_vacancy_id,
  robota_ua_vacancy_id,
  work_ua_publication_type,
  bitrixVacancy,
  localWorkUaVacancy,
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
  const payload = { vacancy: bitrixVacancy };
  if (workUaVacancy) {
    if (
      Number(bitrixVacancy.work_ua_vacancy_id) !== Number(workUaVacancy.id) ||
      work_ua_publication_type !== localWorkUaVacancy.publicationType
    ) {
      payload.workUaVacancy = workUaVacancy;
      payload.work_ua_publication_type = work_ua_publication_type;
    }
  }
  if (robotaUaVacancy) {
    if (
      Number(bitrixVacancy.robota_ua_vacancy_id) !==
      Number(robotaUaVacancy.vacancyId)
    ) {
      payload.robotaUaVacancy = robotaUaVacancy;
    }
  }

  const { _comments: _comments2, isAnyVacancyUpdated } =
    await jobBoardRepo.updateVacancySynchronously({
      bitrix_vacancy_id,
      vacancy_name,
      is_active: false,
      ...payload,
    });

  console.log({ _comments2, isAnyVacancyUpdated });
  comments.push(..._comments2);
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
    work_ua_publication_type,
  } = query;
  const synchronizedVacancy = await jobBoardRepo.getExistingVacancy({
    bitrix_vacancy_id,
  });
  if (!synchronizedVacancy) {
    return await addVacancy({
      bitrix_vacancy_id,
      vacancy_name,
      work_ua_vacancy_id,
      robota_ua_vacancy_id,
      work_ua_publication_type,
    });
  }
  const { bitrixVacancy, localWorkUaVacancy } = synchronizedVacancy;
  return await updateVacancy({
    bitrix_vacancy_id,
    vacancy_name,
    work_ua_vacancy_id,
    robota_ua_vacancy_id,
    work_ua_publication_type,
    bitrixVacancy,
    localWorkUaVacancy,
  });
};
export const activateVacancy = async ({ query }) => {
  devLog({ query });
  const { bitrix_vacancy_id } = query;
  const { bitrixVacancy, localWorkUaVacancy } =
    await jobBoardRepo.getExistingVacancy({
      bitrix_vacancy_id,
    });

  const { work_ua_vacancy_id, robota_ua_vacancy_id } = bitrixVacancy;
  devLog({ work_ua_vacancy_id, robota_ua_vacancy_id });
  const { workUaVacancy, robotaUaVacancy } =
    await getRobotaAndWokUaVacanciesById({
      work_ua_vacancy_id,
      robota_ua_vacancy_id,
      bitrix_vacancy_id,
    });
  devLog({ workUaVacancy, robotaUaVacancy });

  

  if (robota_ua_vacancy_id) {
    const { state } = robotaUaVacancy;
    const is_robota_ua_vacancy_active = state == 'Publicated';
    if (!is_robota_ua_vacancy_active) {
      await activateRobotaUaVacancy({ vacancyId: robota_ua_vacancy_id });
    }

    await updateRobotaUaVacancyActivityState({
      robota_ua_vacancy_id,
      is_active: true,
    });
  }
  if (work_ua_vacancy_id) {
    let is_active = true;

    const { active } = workUaVacancy;
    const is_work_ua_vacancy_active = Boolean(active);
    if (!is_work_ua_vacancy_active) {
      const { availablePublications } = await getWorkUaAvailablePublications();
      const { publicationType: work_ua_publication_type } = localWorkUaVacancy;
      const demandedPublications = availablePublications.find(
        (ap) => ap.id == work_ua_publication_type
      );
      if (!demandedPublications) {
        console.error(`unkonwn publication type ${work_ua_publication_type}`);
        is_active = false;
      } else if (demandedPublications.total > 0) {
        await activateWorkUaVacancy({
          workUaVacancy: localWorkUaVacancy,
        });
      } else {
        is_active = false;
        const comments = [
          `Не залишилося жодної публікації work.ua вибраного типу(${demandedPublications.id}). Виберіть іншу в стадії "оновити-додати до системи", та перенесіть назад до "Пошук"`,
          `Залишки публікацій: Стандарт:${availablePublications[0].total}, СтандартПлюс:${availablePublications[1].total}, Гаряча:${availablePublications[2].total}, Анонімна:${availablePublications[3].total}`,
        ];
        await assignManyCommentsToVacancyRequest({ comments });
      }
    }
    await updateWorkUaVacancyActivityState({
      work_ua_vacancy_id,
      is_active,
    });
  }
  return 'vacancy activated';
};

export const deactivateVacancy = async ({ query }) => {
  console.log({ query });
  const { bitrix_vacancy_id } = query;
  const { bitrixVacancy, localRobotaUaVacancy, localWorkUaVacancy } =
    await jobBoardRepo.getExistingVacancy({
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
