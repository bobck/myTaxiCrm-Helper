import { createVacancyResponseCards } from '../../../bitrix/bitrix.utils.mjs'; // Adjust path if needed
import { processResponse as processWorkUaApiResponse } from '../workua.business-entity.mjs';
import {
  createWorkUaVacancy,
  getAllWorkUaVacancyIds,
  markManyWorkUaVacanciesAsDeleted,
  markWorkUaVacancyAsDeleted,
  updateWorkUaVacancyProgress,
} from '../workua.queries.mjs';
import { getVacancies, getAllResponses } from '../workua.utils.mjs';

export const getAndSaveWorkUaVacancies = async () => {
  console.log({
    module: 'getAndSaveWorkUaVacancies',
    date: new Date(),
  });

  const existingWorkUaVacancyIds = (await getAllWorkUaVacancyIds()).map(
    (item) => item.vacancy_id.toString()
  );

  const { vacancies: currentWorkUaVacancies } = await getVacancies({
    full: 0,
    all: 1,
    active: 1,
  });
  console.log(currentWorkUaVacancies);
  const currentWorkUaVacancyIds = currentWorkUaVacancies.map((vacancy) =>
    vacancy.id.toString()
  );

  const newWorkUaVacancies = currentWorkUaVacancies.filter(
    (vacancy) => !existingWorkUaVacancyIds.includes(vacancy.id.toString())
  );

  const deletedWorkUaVacancies = existingWorkUaVacancyIds.filter(
    (vacancyId) => !currentWorkUaVacancyIds.includes(vacancyId)
  );

  console.log('Current Work.ua Vacancies:', currentWorkUaVacancies.length);
  console.log('New Work.ua Vacancies to add:', newWorkUaVacancies.length);
  for (const vacancy of newWorkUaVacancies) {
    const { id, name, date } = vacancy; 
    console.log(
      `Adding new Work.ua vacancy: ID=${id}, Name=${name}, Date=${date}`
    );
    await createWorkUaVacancy({
      vacancy_id: id.toString(),
      vacancy_name: name,
      vacancy_date: date, 
    });
  }

  console.log(
    'Work.ua Vacancies to mark as deleted:',
    deletedWorkUaVacancies.length
  );
  await markManyWorkUaVacanciesAsDeleted({
    vacancy_ids: deletedWorkUaVacancies,
  });
};

if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  await getAndSaveWorkUaVacancies();
}
