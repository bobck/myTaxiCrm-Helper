import {
  getAllActiveWorkUaVacancies,
  updateWorkUaVacancyProgress,
} from '../workua.queries.mjs';
import {
  getAllWorkUaVacanciesFromAPI,
  getWorkUaRegions,
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
import { vacancyRequestTypeId } from '../../job-board.constants.mjs';

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
      return (
        Number(vacancy.id) === Number(work_ua_vacancy_id) && vacancy.active
      );
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
  if (trackedActiveWorkUaVacancies.length === 0) {
    return;
  }
  const regions = await getWorkUaRegions();
  const { vacancies: allActiveWorkUaVacancies } =
    await getAllWorkUaVacanciesFromAPI();

  for (const vacancy of trackedActiveWorkUaVacancies) {
    const {
      last_apply_id,
      work_ua_vacancy_id,
      name,
      bitrix_vacancy_id,
      region,
      last_apply_date,
    } = vacancy;

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
    let { responses: currentApplies } = await getWorkUaVacancyResponses({
      vacancyId: work_ua_vacancy_id,
      last_id: last_apply_id,
    });
    if (currentApplies.length === 0) {
      devLog(`No new applies for Work.ua Vacancy ID ${work_ua_vacancy_id}`);

      continue;
    }
    if (!last_apply_id) {
      currentApplies= currentApplies.filter((apply) => {
        const applyDate = new Date(apply.date);
        const lastApplyDate = new Date(last_apply_date);
        

        // Check if both dates are valid
        if (isNaN(applyDate.getTime()) || isNaN(lastApplyDate.getTime())) {
          console.warn(
            'Invalid date found in filtering:',
            apply.date,
            last_apply_date
          );
          return false; // Or handle as appropriate
        }

        return applyDate > lastApplyDate;
      });
      
    }
   
    devLog(
      `Fetched ${currentApplies.length} applies for vacancy ${work_ua_vacancy_id}. Last Apply ID: ${last_apply_id}`
    );
    const city = regions.find((r) => r.id == region);
    const processedApplies = await Promise.all(
      assignPayloadToVacancyApply({
        applies: currentApplies,
        payload: {
          title: name,
          city: `${city.name_ua}, ${city.region}`,
        },
      }).map(processWorkUaApiResponse)
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
      return;
    }
  }
};

if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  await getAndSaveWorkUaVacancyApplies();
}
