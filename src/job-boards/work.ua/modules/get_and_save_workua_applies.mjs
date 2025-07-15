import {
  getAllActiveWorkUaVacancies,
  updateWorkUaVacancyProgress,
} from '../workua.queries.mjs';
import {
  getAllWorkUaVacanciesFromAPI,
  getWorkUaVacancyResponses,
} from '../workua.utils.mjs';
import { processResponse as processWorkUaApiResponse } from '../workua.business-entity.mjs';
import {
  addCommentToEntity,
  chunkArray,
  createVacancyResponseCards,
} from '../../../bitrix/bitrix.utils.mjs';
import { assignPayloadToVacancyApply } from '../../job-board.utils.mjs';
import { devLog } from '../../../shared/shared.utils.mjs';

const computePaginationProgress = ({ applies }) => {
  if (!applies || !Array.isArray(applies) || applies.length === 0) {
    return { biggestDate: null, biggestId: null };
  }

  let maxDate = new Date(0);
  let maxId = -1;

  let biggestDateString = null;
  let biggestIdString = null;

  applies.forEach((apply) => {
    const currentDate = new Date(apply.date);
    if (currentDate > maxDate) {
      maxDate = currentDate;
      biggestDateString = apply.date;
    }

    const currentId = parseInt(apply.id, 10);
    if (currentId > maxId) {
      maxId = currentId;
      biggestIdString = apply.id;
    }
  });

  return { biggestDate: biggestDateString, biggestId: biggestIdString };
};
const checkIfWorkUaVacancyStaysActive = async ({
  work_ua_vacancy_id,
  allVacancies,
}) => {
  return {
    is_active: allVacancies.some((vacancy) => {
      return vacancy.id === work_ua_vacancy_id && vacancy.active;
    }),
  };
};
export const getAndSaveWorkUaVacancyApplies = async () => {
  const { activeVacancies: trackedActiveWorkUaVacancies } =
    await getAllActiveWorkUaVacancies();
  console.log({
    module: 'getAndSaveWorkUaVacancyApplies',
    date: new Date(),
    activeWorkUaVacancies: trackedActiveWorkUaVacancies.length,
  });
  const { vacancies: allActiveWorkUaVacancies } =
    await getAllWorkUaVacanciesFromAPI();
  for (const vacancy of trackedActiveWorkUaVacancies) {
    const { last_apply_id, work_ua_vacancy_id, name } = vacancy;
    devLog(`Processing Work.ua Vacancy ID: ${work_ua_vacancy_id}`);

    const { is_active } = await checkIfWorkUaVacancyStaysActive({
      work_ua_vacancy_id,
      allVacancies: allActiveWorkUaVacancies,
    });

    if (!is_active) {
      const comment = `Вакансія work.ua id:${work_ua_vacancy_id} не активна. Щоб її активувати - необхідно перенести до стадії "оновити-додати до системи", потім знову до "Пошук"`;
      devLog({ comment });
      await addCommentToEntity({
        comment,
        typeId: vacancyRequestTypeId,
        entityId: bitrix_vacancy_id,
      });
      continue;
    }
    const { responses: currentApplies } = await getWorkUaVacancyResponses({
      vacancyId: work_ua_vacancy_id,
      last_id: last_apply_id,
    });
    if (currentApplies.length === 0) {
      devLog(`No new applies for Work.ua Vacancy ID ${work_ua_vacancy_id}`);

      continue;
    }

    devLog(
      `Fetched ${currentApplies.length} applies for vacancy ${work_ua_vacancy_id}. Last Apply ID: ${last_apply_id}`
    );

    const processedApplies = await Promise.all(
      assignPayloadToVacancyApply({
        applies: currentApplies,
        title: name,
      })
        .map(processWorkUaApiResponse)
        .slice(0, 2)
    );

    const chunkedApplies = chunkArray(processedApplies, 8);
    for (const chunk of chunkedApplies) {
      await createVacancyResponseCards({
        dtos: chunk,
      });
      const { biggestDate, biggestId } = computePaginationProgress({
        applies: processedApplies,
      });
      await updateWorkUaVacancyProgress({
        work_ua_vacancy_id,
        last_apply_id: biggestId,
        last_apply_date: biggestDate,
      });
    }
  }
};

if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  await getAndSaveWorkUaVacancyApplies();
}
