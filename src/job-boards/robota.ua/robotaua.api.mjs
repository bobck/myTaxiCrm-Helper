import axios from 'axios';

class RobotaUaApiClient {
  constructor(token) {
    this.employerApi = axios.create({
      baseURL: 'https://employer-api.robota.ua',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  static async initialize({ email, password }) {
    const authApi = axios.create({
      baseURL: 'https://auth-api.robota.ua',
    });

    try {
      const response = await authApi.post('/Login', {
        username: email,
        password: password,
        remember: true,
      });
      console.log({ data: response.data });
      const token = response.data;
      if (!token) {
        throw new Error('Token not found in login response.');
      }
      return new RobotaUaApiClient(token);
    } catch (error) {
      console.error('Robota.ua Authentication failed.');
      if (error.response) {
        console.error(`Status: ${error.response.status}`, error.response.data);
      }
      throw error;
    }
  }

  async getResponses(
    options = { vacancyId: 0, folderId: 0, page: 0, filter: '' }
  ) {
    try {
      const response = await this.employerApi.post('/apply/list', options);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  async changeVacancyState(vacancyId, state) {
    const validStates = ['Deleted', 'Closed', 'Publicated', 'NotPublicated'];
    if (!validStates.includes(state)) {
      throw new Error(
        `Invalid state: ${state}. Must be one of ${validStates.join(', ')}`
      );
    }
    try {
      const response = await this.employerApi.post(
        `/vacancy/state/${vacancyId}?state=${state}`
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  async addOrEditVacancy(vacancyData) {
    try {
      const response = await this.employerApi.post('/vacancy/add', vacancyData);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  handleApiError(error) {
    console.error('Robota.ua API Error:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`, error.response.data);
    } else {
      console.error('An unexpected error occurred:', error.message);
    }
    throw error;
  }
}

export default RobotaUaApiClient;
