import {
  createBitrixVacancy,
  getVacancyById,
  updateBitrixVacancy,
} from '../../../job-boards/job-board.queries.mjs';
import {
  createRobotaUaSynchronizedVacancy,
  getAnyRobotaUaVacancyById,
  updateRobotaUaSynchronizedVacancy,
} from '../../../job-boards/robota.ua/robotaua.queries.mjs';
import {
  createWorkUaSynchronizedVacancy,
  getAnyWorkUaVacancyById,
  updateWorkUaSynchronizedVacancy,
} from '../../../job-boards/work.ua/workua.queries.mjs';

export const getExistingVacancy = async ({ bitrix_vacancy_id }) => {
  const vacancy = await getVacancyById({ bitrix_vacancy_id });
  // console.log(vacancy);

  return { vacancy };
};
export const addVacancySynchronously = async ({
  bitrix_vacancy_id,
  vacancy_name,
  workUaVacancy,
  robotaUaVacancy,
  is_active,
}) => {
  console.log({
    message: 'creating vacancy',
    bitrix_vacancy_id,
    vacancy_name,
  });
  const _comments = [];
  let commentsLimit = 0;
  const payload = {};

  const { work_ua_vacancy_id } = workUaVacancy;
  const { robota_ua_vacancy_id } = robotaUaVacancy;

  const existingRobotaUaVacancy = await getAnyRobotaUaVacancyById({
    robota_ua_vacancy_id,
  });
  const existingWorkUaVacancy = await getAnyWorkUaVacancyById({
    work_ua_vacancy_id,
  });

  console.log('bitrix vacancy created');
  if (robotaUaVacancy) {
    commentsLimit++;
    if (existingRobotaUaVacancy) {
      _comments.push(
        `Подана вакансія robota.ua id:${robota_ua_vacancy_id} вже існує в системі.`
      );
    } else {
      await createRobotaUaSynchronizedVacancy({
        bitrix_vacancy_id,
        robotaUaVacancy,
        is_active,
      });
      payload.robota_ua_vacancy_id = robota_ua_vacancy_id;
      console.log('robota vacancy created');
    }
  }
  if (workUaVacancy) {
    commentsLimit++;
    if (existingWorkUaVacancy) {
      _comments.push(
        `Подана вакансія work.ua id:${work_ua_vacancy_id} вже існує в системі.`
      );
    } else {
      await createWorkUaSynchronizedVacancy({
        bitrix_vacancy_id,
        workUaVacancy,
        is_active,
      });
      payload.work_ua_vacancy_id = work_ua_vacancy_id;
      console.log('work vacancy created');
    }
  }
  if (commentsLimit <= _comments.length) {
    return { comments: _comments, isAnyVacancyCreated: false };
  }
  await createBitrixVacancy({
    bitrix_vacancy_id,
    vacancy_name,
    is_active,
    ...payload,
  });
  return { comments: _comments, isAnyVacancyCreated: true };
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
  const comments = [];
  let commentsLimit = 0;
  const payload = {};
  const { work_ua_vacancy_id } = workUaVacancy;
  const { robota_ua_vacancy_id } = robotaUaVacancy;

  const existingRobotaUaVacancy = await getAnyRobotaUaVacancyById({
    robota_ua_vacancy_id,
  });
  const existingWorkUaVacancy = await getAnyWorkUaVacancyById({
    work_ua_vacancy_id,
  });

  if (robota_ua_vacancy_id) {
    commentsLimit++;
    if (existingRobotaUaVacancy) {
      comments.push(
        `Подана вакансія robota.ua id:${robota_ua_vacancy_id} вже існує в системі.`
      );
    } else {
      await updateRobotaUaSynchronizedVacancy({
        bitrix_vacancy_id,
        robota_ua_vacancy_id,
        is_active,
      });
      payload.robota_ua_vacancy_id = robota_ua_vacancy_id;
      console.log('robota vacancy updated');
    }
  }
  if (work_ua_vacancy_id) {
    commentsLimit++;
    if (existingWorkUaVacancy) {
      comments.push(
        `Подана вакансія work.ua id:${work_ua_vacancy_id} вже існує в системі.`
      );
    } else {
      await updateWorkUaSynchronizedVacancy({
        bitrix_vacancy_id,
        work_ua_vacancy_id,
        is_active,
      });
      payload.work_ua_vacancy_id = work_ua_vacancy_id;
    }
  }
  if (comments.length >= commentsLimit) {
    return { comments, isAnyVacancyUpdated: false };
  }
  await updateBitrixVacancy({
    bitrix_vacancy_id,
    vacancy_name,
    work_ua_vacancy_id,
    robota_ua_vacancy_id,
    is_active,
  });
  return { comments, isAnyVacancyUpdated: true };
};

export const synchronizeWorkUaVacancy = async ({ workUaVacancy, vacancy }) => {
  const { bitrix_vacancy_id } = vacancy;
  const { id, is_active, region } = workUaVacancy;
  await createWorkUaSynchronizedVacancy({
    bitrix_vacancy_id,
    work_ua_vacancy_id: id,
    is_active,
    region,
  });
};
export const synchronizeRobotaUaVacancy = async ({
  robotaUaVacancy,
  vacancy,
}) => {
  const { bitrix_vacancy_id } = vacancy;
  const { vacancyId, is_active, region } = robotaUaVacancy;
  await createRobotaUaSynchronizedVacancy({
    bitrix_vacancy_id,
    robota_ua_vacancy_id: vacancyId,
    is_active,
    region,
  });
};
