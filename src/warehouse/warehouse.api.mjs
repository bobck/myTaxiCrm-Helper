import axios from 'axios';

export const autonovadAPI = axios.create({
  baseURL: 'https://autonovad.ua/',
  withCredentials: true,
});
