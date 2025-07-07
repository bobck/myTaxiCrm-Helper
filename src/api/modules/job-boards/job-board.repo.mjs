import { getVacancyById } from '../../../job-boards/job-board.queries.mjs';

export const getExistingVacancy = async ({ bitrix_vacancy_id }) => {
  const vacancy = await getVacancyById({ bitrix_vacancy_id });
  console.log(vacancy);

  return { vacancy };
};
