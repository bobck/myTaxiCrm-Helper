import { robotaUaAPI, robotaUaAuthAPI } from './job-board.apis.mjs';

//https://auth-api.robota.ua/Login

export const getRobotaUaTokenToEnv = async () => {
  const requestBody = {
    username: process.env.ROBOTA_UA_EMAIL,
    password: process.env.ROBOTA_UA_PASSWORD,
  };
  const axiosConfig = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const response = await robotaUaAuthAPI.post(
    '/Login',
    requestBody,
    axiosConfig
  );
  console.log('Login successful, token:', response.data.token);
};
