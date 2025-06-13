import RobotaUaApiClient from './robotaua.api.mjs';

const robotaUaAPI = await RobotaUaApiClient.initialize({
  email: process.env.ROBOTA_UA_EMAIL,
  password: process.env.ROBOTA_UA_PASSWORD,
});
export const getVacancyList=async()=>{
  const resp=await robotaUaAPI.getVacancies();
  return resp;
}
export const getVanacyApplies = async ({vacancyId}) => {
  const {applies} = await robotaUaAPI.getResponses({ vacancyId });

  return {applies};
};
