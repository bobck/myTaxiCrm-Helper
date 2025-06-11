import { checkJobs } from "../work.ua.utils.mjs";

export const getAndSaveWorkUaVacanciesManually = async () => {
  console.log({
    module: 'getAndSaveWorkUaVacanciesManually',
    date: new Date(),
  });
  const result = await checkJobs();
  console.log({result})
};

if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  await getAndSaveWorkUaVacanciesManually();
}
