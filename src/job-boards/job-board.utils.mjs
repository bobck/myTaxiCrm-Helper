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
export async function performLogin(credentials, cookieString = '', customHeaders = {}) {
  const authBaseURL = process.env.ROBOTA_UA_AUTH_API;

  const requestBody = {
    username: credentials.username,
    password: credentials.password,
  };

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
    'Origin': 'https://robota.ua',
    'Referer': 'https://robota.ua/',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
    'Sec-CH-UA': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
    'Sec-CH-UA-Mobile': '?0',
    'Sec-CH-UA-Platform': '"Linux"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    ...(cookieString && { 'Cookie': cookieString }), // Add Cookie header only if cookieString is provided
    ...customHeaders,
  };

  const endpoint = '/Login';

  console.log(`Attempting POST to ${authBaseURL}${endpoint}`);
  console.log('Request Body:', requestBody);
  console.log('Request Headers:', defaultHeaders);

  try {
    const response = await robotaUaAuthAPI.post(endpoint, requestBody, { headers: defaultHeaders });
    console.log('Login request successful!');
    console.log('Status Code:', response.status);
    console.log('Response Data:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error during login request to ${authBaseURL}${endpoint}:`, error.message);
    if (error.response) {
      console.error('Status Code:', error.response.status);
      console.error('Response Data:', error.response.data);
      console.error('Response Headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error details:', error.message);
    }
    throw error;
  }
}

async function getVacanciesList(bearerToken, requestBody, customHeaders = {}) {
  // The requestBody is crucial and needs to be the actual JSON payload
  // that results in a content-length of around 2559.
  // This is just a placeholder.
  if (!requestBody || Object.keys(requestBody).length === 0) {
      console.warn("Request body is empty or not provided. The API might expect a specific payload.");
  }

  const endpoint = '/?q=GetVacanciesList';
  const defaultHeaders = {
    'Authorization': `Bearer ${bearerToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
    'apollographql-client-name': 'web-alliance-desktop',
    'apollographql-client-version': 'a3ba194',
    'Origin': 'https://robota.ua',
    'Referer': 'https://robota.ua/',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
    'accept-language': 'uk', // As seen in your provided headers
    'cache-control': 'no-cache',
    'pragma': 'no-cache',
    'Sec-CH-UA': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
    'Sec-CH-UA-Mobile': '?0',
    'Sec-CH-UA-Platform': '"Linux"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site', // Assuming dracula.robota.ua is treated as same-site to robota.ua
    ...customHeaders,
  };

  console.log(`Attempting POST to ${draculaBaseURL}${endpoint}`);
  console.log('Request Body:', JSON.stringify(requestBody).substring(0, 500) + '...'); // Log a snippet
  console.log('Request Headers:', defaultHeaders);

  try {
    const response = await draculaAPI.post(endpoint, requestBody, { headers: defaultHeaders });
    console.log('GetVacanciesList request successful!');
    console.log('Status Code:', response.status);
    console.log('Response Data:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error during GetVacanciesList request to ${draculaBaseURL}${endpoint}:`, error.message);
    if (error.response) {
      console.error('Status Code:', error.response.status);
      console.error('Response Data:', error.response.data);
      console.error('Response Headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error details:', error.message);
    }
    throw error;
  }
}