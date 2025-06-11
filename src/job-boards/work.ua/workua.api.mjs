import axios from 'axios';

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

  async getResponsesByJobId(jobId, options = {}) {
    if (!jobId) {
      throw new Error('Job ID is required to get responses.');
    }
    try {
      const response = await this.api.get(`/jobs/${jobId}/responses`, {
        params: options,
      });
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
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
