import { getAPI } from "../robotaua.utils.mjs";


export const getAndSaveRobotaUaVacancies = async () => {
  console.log({
    module: 'getAndSaveRobotaUaVacancies',
    date: new Date(),
  });
  const result= await getAPI()
  console.log({result})
};

if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  await getAndSaveRobotaUaVacancies();
}
