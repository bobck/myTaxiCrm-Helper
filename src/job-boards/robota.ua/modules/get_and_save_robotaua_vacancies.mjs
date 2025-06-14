import { getVacancyList, getVacancyApplies } from '../robotaua.utils.mjs';

export const getAndSaveRobotaUaVacancies = async () => {
  console.log({
    module: 'getAndSaveRobotaUaVacancies',
    date: new Date(),
  });
  const { applies } = await getVacancyApplies();
  const example = applies.find((apply) => {
    const { experiences, educations, contacts, additionalsEducations } = apply;
    const { emails, phones, socials } = contacts;

    return (
      experiences.length > 0 && educations.length > 0
      // &&additionalsEducations > 0
    );
  });
  console.log({ example });
  const { experiences, educations, contacts, additionalsEducations } = example;
  const { emails, phones, socials } = contacts;
  console.log('experiences: ', experiences);
  console.log('educations: ', educations);
  console.log('contacts: ', contacts);
  console.log('additionalsEducations: ', additionalsEducations);
};

if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  await getAndSaveRobotaUaVacancies();
}
