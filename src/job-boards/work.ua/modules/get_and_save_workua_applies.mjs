import {
  getAllActiveWorkUaVacancies,
  updateWorkUaVacancyProgress,
  getLastWorkUaVaccancyApply,
} from '../workua.queries.mjs';
import { getVacancyResponses } from '../workua.utils.mjs'; // Предполагается, что getVacancyResponses будет импортирован из workua.utils.mjs
import { processResponse as processWorkUaApiResponse } from '../workua.business-entity.mjs';
import {
  chunkArray,
  createVacancyResponseCards,
} from '../../../bitrix/bitrix.utils.mjs'; // Adjust path if needed
import { assignVacancyTitleToApplies } from '../../job-board.utils.mjs';



export const getAndSaveWorkUaVacancyApplies = async () => {
  console.log({
    module: 'getAndSaveWorkUaVacancyApplies',
    date: new Date(),
  });

  const { activeVacancies: activeWorkUaVacancies } =
    await getAllActiveWorkUaVacancies();
  // let allApplies = [];
  for (const vacancy of activeWorkUaVacancies) {
    console.log(`Processing Work.ua Vacancy ID: ${vacancy.vacancy_id}`);

    const { last_apply_id,work_ua_vacancy_id, vacancy_name } = vacancy;
    const { responses: currentApplies } = await getVacancyResponses({
      vacancyId: work_ua_vacancy_id,
      last_id: 0,
      last_id: 370274985,
    });
    console.log(currentApplies);
    return;
    if (currentApplies.length === 0) {
      // console.log(
      //   `No new applies for Work.ua Vacancy ID ${vacancy.vacancy_id}`
      // );
      continue;
    }

    console.log(
      `Fetched ${currentApplies.length} applies for vacancy ${vacancy.vacancy_id}. Last Apply ID: ${last_apply_id}`
    );

    // allApplies.push(
    //   ...assignVacancyTitleToApplies({
    //     applies: currentApplies,
    //     title: vacancy_name,
    //   })
    // );

    // console.log(allApplies)
    // return;

    const processedApplies = await Promise.all(
      assignVacancyTitleToApplies({
        applies: currentApplies,
        title: vacancy_name,
      }).map(processWorkUaApiResponse)
    );

    console.log({ processedApplies: processedApplies.length }); // Для отладки
    return;
    const chunkedApplies = chunkArray(processedApplies, 8);
    for (const chunk of chunkedApplies) {
      const batchObj = await createVacancyResponseCards({
        dtos: chunk,
      });
      await updateWorkUaVacancyProgress({
        vacancy_id: vacancy.vacancy_id,
        last_apply_id: chunk[chunk.length - 1].id,
      });
      console.log(batchObj);
      break;
    }

    if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
      if (++counter >= vacanciesCount) break;
    }
  }
};

if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  await getAndSaveWorkUaVacancyApplies();
}
