import { robotaUaAPI, robotaUaAuthAPI } from './job-board.apis.mjs';

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
export async function performLogin(
  credentials,
  cookieString = '',
  customHeaders = {}
) {
  const authBaseURL = process.env.ROBOTA_UA_AUTH_API;

  const requestBody = {
    username: credentials.username,
    password: credentials.password,
  };

  const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/plain, */*',
    Origin: 'https://robota.ua',
    Referer: 'https://robota.ua/',
    'User-Agent':
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
    'Sec-CH-UA':
      '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
    'Sec-CH-UA-Mobile': '?0',
    'Sec-CH-UA-Platform': '"Linux"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    ...(cookieString && { Cookie: cookieString }),
    ...customHeaders,
  };

  const endpoint = '/Login';

  try {
    const response = await robotaUaAuthAPI.post(endpoint, requestBody, {
      headers: defaultHeaders,
    });
    console.log('Login request successful!');
    console.log('Status Code:', response.status);
    console.log('Response Data:', response.data);
    return response.data;
  } catch (error) {
    console.error(
      `Error during login request to ${authBaseURL}${endpoint}:`,
      error.message
    );
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

export async function getVacanciesList(
  bearerToken,
  graphQLPayload,
  customHeaders = {}
) {
  // graphQLPayload is crucial and needs to be the actual JSON payload
  // for the GraphQL query.
  console.log('calling getVacanciesList...');
  if (!graphQLPayload || Object.keys(graphQLPayload).length === 0) {
    console.warn(
      'GraphQL payload is empty or not provided. The API might expect a specific payload.'
    );
  }

  const endpoint = '/?q=GetVacanciesList'; 
  const defaultHeaders = {
    Authorization: `Bearer ${bearerToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/json, text/plain, */*',
    'apollographql-client-name': 'web-alliance-desktop',
    'apollographql-client-version': 'a3ba194',
    Origin: 'https://robota.ua',
    Referer: 'https://robota.ua/',
    'User-Agent':
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
    'accept-language': 'uk',
    'cache-control': 'no-cache',
    pragma: 'no-cache',
    'Sec-CH-UA':
      '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
    'Sec-CH-UA-Mobile': '?0',
    'Sec-CH-UA-Platform': '"Linux"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    ...customHeaders,
  };

  console.log('calling getVacanciesList...');
  try {
    const response = await robotaUaAPI.post(endpoint, graphQLPayload, {
      headers: defaultHeaders,
    });
    console.log('GetVacanciesList request successful!');
    console.log('Status Code:', response.status);
    console.log('Response Data:', response.data);
    return response.data;
  } catch (error) {
    console.error(
      `Error during GetVacanciesList request to ${draculaBaseURL}${endpoint}:`,
      error.message
    );
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
