import { processApiResponse } from '../robotaua.business-entity.mjs';
import { getVacancyList, getVacancyApplies } from '../robotaua.utils.mjs';

const processApplies = ({ applies }) => {};

export const getAndSaveRobotaUaVacancies = async () => {
  console.log({
    module: 'getAndSaveRobotaUaVacancies',
    date: new Date(),
  });
  const { applies } = await getVacancyApplies();
  // console.log(applies)
  // const a=applies.reduce((acc,curr)=>{
  //   if(!acc.has(curr.resumeType)){
  //     acc.set(curr.resumeType,curr)
  //   }
      
  //   return acc
  // },new Map())
  // console.log(a)
  console.log(applies)
  return
  const processedApplies = applies.map(processApiResponse);
  console.log(processedApplies);

  // const example = applies.find((apply) => {
  //   const { experiences, educations, contacts, additionalsEducations } = apply;
  //   const { emails, phones, socials } = contacts;

  //   return (
  //     experiences.length > 0 && educations.length > 0
  //     // &&additionalsEducations > 0
  //   );
  // });
  // console.log({ example });
  // const { experiences, educations, contacts, additionalsEducations } = example;
  // const { emails, phones, socials } = contacts;
  // console.log('experiences: ', experiences);
  // console.log('educations: ', educations);
  // console.log('contacts: ', contacts);
  // console.log('additionalsEducations: ', additionalsEducations);
};

if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  await getAndSaveRobotaUaVacancies();
}
