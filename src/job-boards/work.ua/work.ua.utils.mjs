import WorkUaApiClient from './work.ua.api.mjs';

const workUaAPI = new WorkUaApiClient({
  email: process.env.WORK_UA_EMAIL,
  password: process.env.WORK_UA_PASSWORD,
});

export const checkJobs = async () => {
    return workUaAPI.token;
//   return await workUaAPI.checkLoginAndGetJobs();
};
