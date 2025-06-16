import RobotaUaApiClient from './robotaua.api.mjs';

export const robotaUaAPI = await RobotaUaApiClient.initialize({
  email: process.env.ROBOTA_UA_EMAIL,
  password: process.env.ROBOTA_UA_PASSWORD,
});
export const getVacancyList = async () => {
  const resp = await robotaUaAPI.getVacancies();
  return resp;
};
export const getVacancyApplies = async ({ vacancyId } = { vacancyId: 0 }) => {
  const { applies } = await robotaUaAPI.getApplies({ vacancyId });

  return { applies };
};
