import {
  getAllActiveWorkUaVacancies,
  updateWorkUaVacancyProgress,
  getLastWorkUaVaccancyApply,
} from '../workua.queries.mjs';
import { getVacancyResponses } from '../workua.utils.mjs'; // Предполагается, что getVacancyResponses будет импортирован из workua.utils.mjs
import { processResponse as processWorkUaApiResponse } from '../workua.business-entity.mjs';
import { createVacancyResponseCards } from '../../../bitrix/bitrix.utils.mjs'; // Adjust path if needed

const vacanciesCount = 35;
let counter = 0;

export const getAndSaveWorkUaVacancyApplies = async () => {
  console.log({
    module: 'getAndSaveWorkUaVacancyApplies',
    date: new Date(),
  });

  const { activeVacancies: activeWorkUaVacancies } =
    await getAllActiveWorkUaVacancies();
  let allApplies = [];
  for (const vacancy of activeWorkUaVacancies) {
    console.log(`Processing Work.ua Vacancy ID: ${vacancy.vacancy_id}`);

    const { last_apply_id, vacancy_id } = vacancy;
    const { responses: currentApplies } = await getVacancyResponses({
      vacancyId: vacancy_id,

      last_id: 0,
    });
    // console.log(currentApplies)

    if (currentApplies && currentApplies.length > 0) {
      console.log(
        `Fetched ${currentApplies.length} applies for vacancy ${vacancy.vacancy_id}. Last Apply ID: ${last_apply_id}`
      );

      allApplies.push(...currentApplies);
    }

    if (currentApplies.length > 0) {
      // Обновляем last_apply_id в базе данных
      await updateWorkUaVacancyProgress({
        vacancy_id: vacancy.vacancy_id,
        last_apply_id: currentApplies[currentApplies.length - 1].id,
      });
    } else {
      console.log(
        `No new applies for Work.ua Vacancy ID ${vacancy.vacancy_id}`
      );
    }
    // Ограничение для DEV/TEST среды, если нужно
    if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
      if (++counter >= vacanciesCount) break;
    }
  }

  const processedApplies = await Promise.all(
    allApplies.map(processWorkUaApiResponse)
  );

  console.log({ processedApplies: processedApplies.length }); // Для отладки
  const batchObj = await createVacancyResponseCards({
    dtos: processedApplies,
  }); // Раскомментируйте, когда будете готовы отправлять в Bitrix
  // console.log(batchObj);
  return;
};

if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  await getAndSaveWorkUaVacancyApplies();
}
