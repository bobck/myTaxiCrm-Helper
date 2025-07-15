import {
  createBitrixVacancy,
  getBitrixVacancyById,
  updateBitrixVacancy,
} from '../../../job-boards/job-board.queries.mjs';
import {
  createRobotaUaSynchronizedVacancy,
  getAnyRobotaUaVacancyByBitrixId,
  getAnyRobotaUaVacancyById,
  updateRobotaUaSynchronizedVacancy,
} from '../../../job-boards/robota.ua/robotaua.queries.mjs';
import {
  createWorkUaSynchronizedVacancy,
  getAnyWorkUaVacancyByBitrixId,
  getAnyWorkUaVacancyById,
  updateWorkUaSynchronizedVacancy,
} from '../../../job-boards/work.ua/workua.queries.mjs';

export const getExistingVacancy = async ({ bitrix_vacancy_id }) => {
  const payload = {};
  payload.bitrixVacancy = await getBitrixVacancyById({ bitrix_vacancy_id });
  if (!payload.bitrixVacancy) {
    return null;
  }
  const { work_ua_vacancy_id, robota_ua_vacancy_id } = payload.bitrixVacancy;
  if (work_ua_vacancy_id) {
    payload.localWorkUaVacancy = await getAnyWorkUaVacancyByBitrixId({
      bitrix_vacancy_id,
    });
  }
  if (robota_ua_vacancy_id) {
    payload.localRobotaUaVacancy = await getAnyWorkUaVacancyByBitrixId({
      bitrix_vacancy_id,
    });
  }
  // console.log(vacancy);

  return payload;
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
  });
  const _comments = [];
  let commentsLimit = 0;
  const payload = {};
  if (workUaVacancy) {
    const { id: work_ua_vacancy_id } = workUaVacancy;
    const existingWorkUaVacancy = await getAnyWorkUaVacancyById({
      work_ua_vacancy_id,
    });

    commentsLimit++;
    if (existingWorkUaVacancy) {
      _comments.push(
        `Подана вакансія work.ua id:${work_ua_vacancy_id} вже існує в системі.`
      );
    } else {
      await createWorkUaSynchronizedVacancy({
        bitrix_vacancy_id,
        workUaVacancy,
      });
      payload.work_ua_vacancy_id = work_ua_vacancy_id;
      console.log('work vacancy created');
    }
  }
  console.log({ payload });

  if (robotaUaVacancy) {
    const { vacancyId: robota_ua_vacancy_id } = robotaUaVacancy;
    const existingRobotaUaVacancy = await getAnyRobotaUaVacancyById({
      robota_ua_vacancy_id,
    });
    commentsLimit++;
    if (existingRobotaUaVacancy) {
      _comments.push(
        `Подана вакансія robota.ua id:${robota_ua_vacancy_id} вже існує в системі.`
      );
    } else {
      await createRobotaUaSynchronizedVacancy({
        bitrix_vacancy_id,
        robotaUaVacancy,
      });
      payload.robota_ua_vacancy_id = robota_ua_vacancy_id;
      console.log('robota vacancy created');
    }
  }

  if (commentsLimit <= _comments.length) {
    return { _comments, isAnyVacancyCreated: false };
  }
  console.log({ payload });
  await createBitrixVacancy({
    bitrix_vacancy_id,
    vacancy_name,
    is_active,
    ...payload,
  });
  console.log('bitrix vacancy created');
  return { _comments, isAnyVacancyCreated: true };
};
export const updateVacancySynchronously = async ({
  bitrix_vacancy_id,
  vacancy_name,
  is_active,
  workUaVacancy,
  robotaUaVacancy,
}) => {
  console.log({
    message: 'updating vacancy',
    bitrix_vacancy_id,
    vacancy_name,
  });
  const _comments = [];
  let commentsLimit = 0;
  const payload = {};

  if (robotaUaVacancy) {
    const { vacancyId: robota_ua_vacancy_id } = robotaUaVacancy;
    const existingRobotaUaVacancy = await getAnyRobotaUaVacancyById({
      robota_ua_vacancy_id,
    });

    commentsLimit++;
    if (existingRobotaUaVacancy) {
      if (existingRobotaUaVacancy.bitrix_vacancy_id == bitrix_vacancy_id) {
        await updateRobotaUaSynchronizedVacancy({
          bitrix_vacancy_id,
          robotaUaVacancy,
        });
        payload.robota_ua_vacancy_id = robota_ua_vacancy_id;
        console.log('robota vacancy updated');
      } else {
        _comments.push(
          `Подана вакансія robota.ua id:${robota_ua_vacancy_id} вже існує в системі.`
        );
      }
    } else {
      const existingRobotaUaVacancyByBitrixId =
        await getAnyRobotaUaVacancyByBitrixId({ bitrix_vacancy_id });
      if (existingRobotaUaVacancyByBitrixId) {
        await updateRobotaUaSynchronizedVacancy({
          bitrix_vacancy_id,
          robotaUaVacancy,
        });
      } else {
        await createRobotaUaSynchronizedVacancy({
          bitrix_vacancy_id,
          robotaUaVacancy,
        });
      }

      payload.robota_ua_vacancy_id = robota_ua_vacancy_id;
    }
  }
  if (workUaVacancy) {
    const { id: work_ua_vacancy_id } = workUaVacancy;
    const existingWorkUaVacancy = await getAnyWorkUaVacancyById({
      work_ua_vacancy_id,
    });
    commentsLimit++;
    if (existingWorkUaVacancy) {
      if (existingWorkUaVacancy.bitrix_vacancy_id == bitrix_vacancy_id) {
        await updateWorkUaSynchronizedVacancy({
          bitrix_vacancy_id,
          workUaVacancy,
        });
        payload.work_ua_vacancy_id = work_ua_vacancy_id;
      } else {
        _comments.push(
          `Подана вакансія work.ua id:${work_ua_vacancy_id} вже існує в системі.`
        );
      }
    } else {
      const existingWorkUaVacancyByBitrixId =
        await getAnyWorkUaVacancyByBitrixId({ bitrix_vacancy_id });
      if (existingWorkUaVacancyByBitrixId) {
        await updateWorkUaSynchronizedVacancy({
          bitrix_vacancy_id,
          workUaVacancy,
        });
      } else {
        await createWorkUaSynchronizedVacancy({
          bitrix_vacancy_id,
          workUaVacancy,
        });
      }
      payload.work_ua_vacancy_id = work_ua_vacancy_id;
    }
  }
  if (_comments.length >= commentsLimit) {
    console.log('no vacancy updated');
    return { _comments, isAnyVacancyUpdated: false };
  }
  await updateBitrixVacancy({
    bitrix_vacancy_id,
    vacancy_name,
    is_active,
    ...payload,
  });
  console.log('vacancy updated');
  return { _comments, isAnyVacancyUpdated: true };
};
export const getVacancySynchronously = async ({ bitrix_vacancy_id }) => {
  console.log({
    message: 'getting vacancy',
    bitrix_vacancy_id,
  });
  const bitrixVacancy = await getBitrixVacancyById({ bitrix_vacancy_id });
  const robotaUaVacancy = await getAnyRobotaUaVacancyByBitrixId({
    bitrix_vacancy_id,
  });
  const workUaVacancy = await getAnyWorkUaVacancyByBitrixId({
    bitrix_vacancy_id,
  });
  return { bitrixVacancy, robotaUaVacancy, workUaVacancy };
};
