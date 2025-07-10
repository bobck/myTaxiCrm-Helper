import {
  addCommentToEntity,
  addManyCommentsToEntity,
} from '../../../bitrix/bitrix.utils.mjs';
import { vacancyRequestTypeId } from '../../../job-boards/job-board.constants.mjs';
import { getRobotaUaVacancyById } from '../../../job-boards/robota.ua/robotaua.utils.mjs';
import { getWorkUaVacancyById } from '../../../job-boards/work.ua/workua.utils.mjs';

export const getRobotaAndWokUaVacanciesById = async ({
  bitrix_vacancy_id,
  work_ua_vacancy_id,
  robota_ua_vacancy_id,
}) => {
  let workUaVacancy,
    robotaUaVacancy,
    commentsLimit = 0;
  const _comments = [];
  if (robota_ua_vacancy_id) {
    commentsLimit++;
    robotaUaVacancy = await getRobotaUaVacancyById({
      vacancyId: robota_ua_vacancy_id,
    });
    if (!robotaUaVacancy && robota_ua_vacancy_id) {
      _comments.push(
        `Вакансія robota.ua id: ${robota_ua_vacancy_id} не знайдена`
      );
    }
  }
  if (work_ua_vacancy_id) {
    commentsLimit++;
    const { vacancy } = await getWorkUaVacancyById({
      vacancyId: work_ua_vacancy_id,
    });
    workUaVacancy = vacancy;
    if (!workUaVacancy) {
      _comments.push(`Вакансія work.ua id: ${work_ua_vacancy_id} не знайдена`);
    }
  }
  if (commentsLimit <= _comments.length) {
    return {
      workUaVacancy,
      robotaUaVacancy,
      _comments,
      isAnyVacancyFound: false,
    };
  }

  return { workUaVacancy, robotaUaVacancy, _comments, isAnyVacancyFound: true };
};
export const assignManyCommentsToVacancyRequest = async ({
  comments,
  bitrix_vacancy_id,
}) => {
  console.log('assigning comments to vacancy request', comments);
  await addManyCommentsToEntity({
    entity_id: bitrix_vacancy_id,
    type_id: vacancyRequestTypeId,
    comments,
  });
};
