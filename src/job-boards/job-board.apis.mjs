import axios from 'axios';

const robotaUaAPIUrl = process.env.ROBOTA_UA_API;

const robotaUaAuthAPIUrl = process.env.ROBOTA_UA_AUTH_API;

export const robotaUaAPI = axios.create({
  baseURL: robotaUaAPIUrl,
});

export const robotaUaAuthAPI = axios.create({
  baseURL: robotaUaAuthAPIUrl,
});
