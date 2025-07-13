import {
  getAllActiveWorkUaVacancies,
  updateWorkUaVacancyProgress,
} from '../workua.queries.mjs';
import { getVacancyResponses } from '../workua.utils.mjs';
import { processResponse as processWorkUaApiResponse } from '../workua.business-entity.mjs';
import {
  chunkArray,
  createVacancyResponseCards,
} from '../../../bitrix/bitrix.utils.mjs';
import { assignVacancyTitleToApplies } from '../../job-board.utils.mjs';
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

export const getAndSaveWorkUaVacancyApplies = async () => {
  console.log({
    module: 'getAndSaveWorkUaVacancyApplies',
    date: new Date(),
  });

  const { activeVacancies: activeWorkUaVacancies } =
    await getAllActiveWorkUaVacancies();

  for (const vacancy of activeWorkUaVacancies) {
    const { last_apply_id, work_ua_vacancy_id, name, last_apply_date } =
      vacancy;
    devLog(`Processing Work.ua Vacancy ID: ${work_ua_vacancy_id}`);
    const { responses: currentApplies } = await getVacancyResponses({
      vacancyId: work_ua_vacancy_id,
      last_id: last_apply_id,
      // last_id: 370274985,
    });

    if (currentApplies.length === 0) {
      devLog(`No new applies for Work.ua Vacancy ID ${work_ua_vacancy_id}`);

      continue;
    }

    devLog(
      `Fetched ${currentApplies.length} applies for vacancy ${work_ua_vacancy_id}. Last Apply ID: ${last_apply_id}`
    );

    const processedApplies = await Promise.all(
      assignVacancyTitleToApplies({
        applies: currentApplies,
        title: name,
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
    }
  }
};

if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  await getAndSaveWorkUaVacancyApplies();
}
