import {
  getAllActiveWorkUaVacancies,
  updateWorkUaVacancyProgress,
} from '../workua.queries.mjs';
import { getVacancyResponses } from '../workua.utils.mjs'; // Предполагается, что getVacancyResponses будет импортирован из workua.utils.mjs
import { processResponse as processWorkUaApiResponse } from '../workua.business-entity.mjs';
import { createVacancyResponseCards } from '../../../bitrix/bitrix.utils.mjs'; // Adjust path if needed

export const getAndSaveWorkUaVacancyApplies = async () => {
  console.log({
    module: 'getAndSaveWorkUaVacancyApplies',
    date: new Date(),
  });

  const { activeVacancies: activeWorkUaVacancies } =
    await getAllActiveWorkUaVacancies();
  let allApplies = [];
  let lastId = 0; // Начинаем с последнего обработанного apply_id
  let hasMoreApplies = true;
  let current_vacancy;
  try {
    for (const vacancy of activeWorkUaVacancies) {
      console.log(`Processing Work.ua Vacancy ID: ${vacancy.vacancy_id}`);

      // let allApplies = [];
      lastId = vacancy.last_apply_id || 0; // Начинаем с последнего обработанного apply_id
      // let hasMoreApplies = true;

      while (hasMoreApplies) {
        current_vacancy = vacancy.vacancy_id;
        const { responses: currentApplies } = await getVacancyResponses({
          // Предполагается, что эта функция будет получать отклики
          vacancyId: vacancy.vacancy_id,
          last_id: lastId,
        });
        // console.log(currentApplies)
        // return;

        if (currentApplies && currentApplies.length > 0) {
          console.log(
            `Fetched ${currentApplies.length} applies for vacancy ${vacancy.vacancy_id}. Last Apply ID: ${lastId}`
          );

          allApplies.push(...currentApplies);
          lastId = currentApplies[currentApplies.length - 1].id; // Обновляем lastId на ID последнего отклика
        } else {
          hasMoreApplies = false; // Больше нет откликов
        }

        // Ограничение для DEV/TEST среды, если нужно
        if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
          // Ограничьте количество обрабатываемых откликов для разработки/тестирования, если это уместно.
          // Например, обрабатывать только одну страницу или несколько откликов.
          // В данном случае, Work.ua API может сам ограничивать количество ответов за запрос.
          // Вы можете добавить условие `if (allApplies.length > someLimit)` чтобы прервать цикл.
        }
      }

      if (allApplies.length > 0) {
        console.log(
          `Total applies for Work.ua Vacancy ID ${vacancy.vacancy_id}: ${allApplies.length}`
        );

        // Обновляем last_apply_id в базе данных
        await updateWorkUaVacancyProgress({
          vacancy_id: vacancy.vacancy_id,
          last_apply_id: lastId,
        });

        const processedApplies = allApplies.map(processWorkUaApiResponse);
        // console.log(processedApplies); // Для отладки
        // await createVacancyResponseCards({ dtos: processedApplies }); // Раскомментируйте, когда будете готовы отправлять в Bitrix
      } else {
        console.log(
          `No new applies for Work.ua Vacancy ID ${vacancy.vacancy_id}`
        );
      }
    }
  } catch (e) {
    console.log({
      allApplies: allApplies.length,
      vacancies: activeWorkUaVacancies.length,
      current_vacancy,
    });
  }
};

if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  await getAndSaveWorkUaVacancyApplies();
}
