export const getAndSaveRobotaUaVacancies = async () => {
  console.log({
    module: 'getAndSaveRobotaUaVacancies',
    date: new Date(),
  });
  const existingVacancyIds = (await getAllVacancyIds()).map(
    (item) => item.vacancy_id
  );

  return;
  const processedApplies = applies.map(processApiResponse);
  // console.log(processedApplies)
  // console.log(await createVacancyResponseCards({ dtos: processedApplies }));
};

if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  await getAndSaveRobotaUaVacancies();


}
