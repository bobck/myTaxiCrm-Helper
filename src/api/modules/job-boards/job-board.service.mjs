import { devLog } from '../../../shared/shared.utils.mjs';
import { updateRobotaUaVacancyActivityState } from '../../../job-boards/robota.ua/robotaua.queries.mjs';
import {
  activateRobotaUaVacancy,
  deactivateRobotaUaVacancy,
} from '../../../job-boards/robota.ua/robotaua.utils.mjs';
import { updateWorkUaVacancyActivityState } from '../../../job-boards/work.ua/workua.queries.mjs';
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
  assigned_by_id,
  // work_ua_publication_type,
  // robota_ua_publication_type,
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
  const payload = { assigned_by_id };
  if (workUaVacancy) {
    // console.log({ workUaVacancy, message: 'found' });
    payload.workUaVacancy = workUaVacancy;
    // payload.work_ua_publication_type = work_ua_publication_type;
  }
  if (robotaUaVacancy) {
    // console.log({ robotaUaVacancy, message: 'found' });
    payload.robotaUaVacancy = robotaUaVacancy;
    // payload.robota_ua_publication_type = robota_ua_publication_type;
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
  assigned_by_id,
  // work_ua_publication_type,
  // robota_ua_publication_type,
  bitrixVacancy,
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
  const payload = { bitrixVacancy, assigned_by_id };
  if (workUaVacancy) {
    if (
      Number(bitrixVacancy.work_ua_vacancy_id) !== Number(workUaVacancy.id)
      // || work_ua_publication_type !== workUaVacancy.publicationType
    ) {
      payload.workUaVacancy = workUaVacancy;
      // payload.work_ua_publication_type = work_ua_publication_type;
    }
  }
  if (robotaUaVacancy) {
    if (
      Number(bitrixVacancy.robota_ua_vacancy_id) !==
      Number(robotaUaVacancy.vacancyId)
      // ||robota_ua_publication_type !== robotaUaVacancy.publishType
    ) {
      payload.robotaUaVacancy = robotaUaVacancy;
      // payload.robota_ua_publication_type = robota_ua_publication_type;
    }
  }
  const { _comments: _comments2, isAnyVacancyUpdated } =
    await jobBoardRepo.updateVacancySynchronously({
      bitrix_vacancy_id,
      vacancy_name,
      is_active: false,
      ...payload,
    });

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
    assigned_by_id,
    // work_ua_publication_type,
    // robota_ua_publication_type,
  } = query;
  const synchronizedVacancy = await jobBoardRepo.getExistingVacancy({
    bitrix_vacancy_id,
  });
  if (!synchronizedVacancy.bitrixVacancy) {
    devLog('creating...');
    return await addVacancy({
      bitrix_vacancy_id,
      vacancy_name,
      work_ua_vacancy_id,
      robota_ua_vacancy_id,
      assigned_by_id,
      // work_ua_publication_type,
      // robota_ua_publication_type,
    });
  }
  devLog('updating...');
  const { bitrixVacancy, localWorkUaVacancy } = synchronizedVacancy;
  return await updateVacancy({
    bitrix_vacancy_id,
    vacancy_name,
    work_ua_vacancy_id,
    robota_ua_vacancy_id,
    assigned_by_id,
    // work_ua_publication_type,
    // robota_ua_publication_type,
    bitrixVacancy,
    localWorkUaVacancy,
  });
};
export const activateVacancy = async ({ query }) => {
  devLog({ query });
  const { bitrix_vacancy_id } = query;
  const { bitrixVacancy, localWorkUaVacancy, localRobotaUaVacancy } =
    await jobBoardRepo.getExistingVacancy({
      bitrix_vacancy_id,
    });
  if (!bitrixVacancy) {
    return;
  }

  const { work_ua_vacancy_id, robota_ua_vacancy_id } = bitrixVacancy;
  devLog({ work_ua_vacancy_id, robota_ua_vacancy_id });
  const { workUaVacancy, robotaUaVacancy } =
    await getRobotaAndWokUaVacanciesById({
      work_ua_vacancy_id,
      robota_ua_vacancy_id,
      bitrix_vacancy_id,
    });
  devLog({ workUaVacancy, robotaUaVacancy });
  const activityState = {
    is_work_ua_vacancy_activated: false,
    is_robota_ua_vacancy_activated: false,
  };
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
        activityState.is_work_ua_vacancy_activated = true;
      } else {
        is_active = false;
        const comments = [
          `Залишки публікацій work.ua: Стандарт:${availablePublications[0].total}, СтандартПлюс:${availablePublications[1].total}, Гаряча:${availablePublications[2].total}, Анонімна:${availablePublications[3].total}`,
          `Не залишилося жодної публікації work.ua вибраного типу(${demandedPublications.id}).`,
          // `Не залишилося жодної публікації work.ua вибраного типу(${demandedPublications.id}). Виберіть інший тип публікації, перенесіть до стадії "Додати/Оновити вакансію у системі", та назад до "Пошук"`
        ];
        await assignManyCommentsToVacancyRequest({
          comments,
          bitrix_vacancy_id,
        });
        return;
      }
    }
    await updateWorkUaVacancyActivityState({
      work_ua_vacancy_id,
      is_active,
    });
    activityState.is_work_ua_vacancy_activated = true;
  }
  await jobBoardRepo.changeVacancyActivityState({
    bitrix_vacancy_id,
    activityState,
  });

  const comments = [`Вакансія успішно активована.`];
  await assignManyCommentsToVacancyRequest({ comments, bitrix_vacancy_id });
};

export const deactivateVacancy = async ({ query }) => {
  const { bitrix_vacancy_id } = query;
  const { bitrixVacancy } = await jobBoardRepo.getExistingVacancy({
    bitrix_vacancy_id,
  });
  if (!bitrixVacancy) {
    return;
  }
  const { work_ua_vacancy_id, robota_ua_vacancy_id } = bitrixVacancy;
  const { workUaVacancy, robotaUaVacancy } =
    await getRobotaAndWokUaVacanciesById({
      work_ua_vacancy_id,
      robota_ua_vacancy_id,
      bitrix_vacancy_id,
    });
  if (robotaUaVacancy) {
    const { state } = robotaUaVacancy;
    const is_robota_ua_vacancy_active = state == 'Publicated';
    if (is_robota_ua_vacancy_active) {
      await deactivateRobotaUaVacancy({ vacancyId: robota_ua_vacancy_id });
    }
  }
  if (workUaVacancy) {
    const { active } = workUaVacancy;
    const is_work_ua_vacancy_active = Boolean(active);
    if (is_work_ua_vacancy_active) {
      await deactivateWorkUaVacancy({ vacancyId: work_ua_vacancy_id });
    }
  }
  await jobBoardRepo.markVacancyAsDeletedSynchronously({ bitrix_vacancy_id });
  const comments = [`Вакансія успішно деактивована.`];
  await assignManyCommentsToVacancyRequest({ comments, bitrix_vacancy_id });
};
