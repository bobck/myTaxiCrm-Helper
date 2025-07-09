import { addCommentToEntity } from '../../../bitrix/bitrix.utils.mjs';
import { vacancyRequestTypeId } from '../../../job-boards/job-board.constants.mjs';
import { getRobotaUaVacancyById } from '../../../job-boards/robota.ua/robotaua.utils.mjs';
import { getWorkUaVacancyById } from '../../../job-boards/work.ua/workua.utils.mjs';

export const getRobotaAndWokUaVacanciesById = async ({
  bitrix_vacancy_id,
  work_ua_vacancy_id,
  robota_ua_vacancy_id,
}) => {
  let workUaVacancy, robotaUaVacancy;
  if (robota_ua_vacancy_id) {
    robotaUaVacancy = await getRobotaUaVacancyById({
      vacancyId: robota_ua_vacancy_id,
    });
    if (!robotaUaVacancy && robota_ua_vacancy_id) {
      const comment = `Вакансія robota.ua id: ${robota_ua_vacancy_id} не знайдена`;
      console.log({ bitrix_vacancy_id, comment });
      //   await addCommentToEntity({
      //     entityId: bitrix_vacancy_id,
      //     typeId: vacancyRequestTypeId,
      //     comment,
      //   });
    }
  }
  if (work_ua_vacancy_id) {
    const {  vacancy } = await getWorkUaVacancyById({
      vacancyId: work_ua_vacancy_id,
    });
    workUaVacancy = vacancy;
    if (!workUaVacancy) {
      const comment = `Вакансія work.ua id: ${work_ua_vacancy_id} не знайдена`;
      console.log({ bitrix_vacancy_id, comment });
      //   await addCommentToEntity({
      //     entityId: bitrix_vacancy_id,
      //     typeId: vacancyRequestTypeId,
      //     comment,
      //   });
    }
  }

  return { workUaVacancy, robotaUaVacancy };
};
