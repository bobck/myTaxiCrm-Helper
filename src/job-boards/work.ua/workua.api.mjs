import axios from 'axios';
export const MAX_RESPONSES_PER_REQ = 50;
class WorkUaApiClient {
  constructor({ email, password, locale }) {
    if (!locale) {
      locale = 'uk_UA';
    }
    if (!email || !password) {
      throw new Error('Email and password are required for authorization.');
    }

    this.token = Buffer.from(`${email}:${password}`).toString('base64');

    this.api = axios.create({
      baseURL: process.env.WORK_UA_API,
      headers: {
        Authorization: `Basic ${this.token}`,
        'User-Agent': 'MyCustomApp (my-app-admin@example.com)',
        'X-Locale': locale,
      },
    });
  }

  async checkLoginAndGetJobs(options = {}) {
    try {
      const response = await this.api.get('/jobs/my', { params: options });
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }
  async getVacancies(options = { full: 1, all: 0, active: 1 }) {
    try {
      const { full, all, active } = options;
      const requestLocation = `/jobs/my?full=${full}&all=${all}&active=${active}`;
      const response = await this.api.get(requestLocation);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }
  async getVacancyResponses(
    vacancyId,
    options = {
      limit: process.env.ENV === 'DEV' ? 50 : MAX_RESPONSES_PER_REQ,
      last_id: 0,
      before_id: 0,
      before: 0,
      sort: 0,
    }
  ) {
    const { limit, last_id, before_id, before, sort } = options;
    let queryParams = `?limit=${limit}&sort=${sort}`;
    if (last_id) {
      queryParams += `&last_id=${last_id}`;
    }
    if (before_id) {
      queryParams += `&before_id=${before_id}`;
    }
    if (before) {
      queryParams += `&before=${before}`;
    }
    const requestLocation = `/jobs/${vacancyId}/responses/`;
    const requestUrl = requestLocation + queryParams;
    const { data } = await this.api.get(requestUrl);
    const { items: responses } = data;

    return { responses };
  }
  async getResponses(options = {}) {
    const { limit, last_id, before_id, before, sort } = options;
    let queryParams = `?limit=${limit}&sort=${sort}`;

    if (last_id) {
      queryParams += `&last_id=${last_id}`;
    }
    if (before_id) {
      queryParams += `&before_id=${before_id}`;
    }
    if (before) {
      queryParams += `&before=${before}`;
    }

    const endpoint = '/jobs/responses/';
    const requestUrl = endpoint + queryParams;
    console.log(requestUrl);
    return await this.api(requestUrl);
  }
  handleApiError(error) {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          console.error(
            'API Error: 401 Unauthorized. Please check your email and password.'
          );
          break;
        case 403:
          console.error('API Error: 403 Forbidden. The user is blocked.');
          break;
        case 404:
          console.error(
            `API Error: 404 Not Found. The resource could not be found.`
          );
          break;
        case 429:
          console.error(
            'API Error: 429 Too Many Requests. You are being rate-limited.'
          );
          break;
        default:
          console.error(
            `API Error: ${error.response.status} ${error.response.statusText}`
          );
      }
      if (error.response.data) {
        console.error(
          'Error details:',
          JSON.stringify(error.response.data, null, 2)
        );
      }
    } else {
      console.error('An unexpected error occurred:', error.message);
    }
    throw error;
  }
}

export default WorkUaApiClient;
