import { checkJobs, getVacancies, getVacancyIds } from '../workua.utils.mjs';

export const getAndSaveWorkUaVacanciesManually = async () => {
  console.log({
    module: 'getAndSaveWorkUaVacanciesManually',
    date: new Date(),
  });
  const { vacancyIds } = await getVacancyIds();
  for(const [index,vacancyId] of vacancyIds.entries()){
    if (index>1){
      return;
    }
    
  }
};

if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  await getAndSaveWorkUaVacanciesManually();
}
