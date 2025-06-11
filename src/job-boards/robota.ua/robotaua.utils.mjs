import RobotaUaApiClient from './robotaua.api.mjs';

const robotaUaAPI = await RobotaUaApiClient.initialize({
  email: process.env.ROBOTA_UA_EMAIL,
  password: process.env.ROBOTA_UA_PASSWORD,
});

export const getAPI = async () => {
  return robotaUaAPI;
};
