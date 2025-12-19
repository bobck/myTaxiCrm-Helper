import axios from 'axios';
import { devLog } from '../../shared/shared.utils.mjs';

class RobotaUaApiClient {
  constructor(token) {
    this.employerApi = axios.create({
      baseURL: process.env.ROBOTA_UA_API,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
  static async initialize({ email, password }) {
    const authApi = axios.create({
      baseURL: process.env.ROBOTA_UA_AUTH_API,
    });

    try {
      const response = await authApi.post('/Login', {
        username: email,
        password: password,
        remember: true,
      });
      // console.log({ data: response.data });
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
  async getVacancies(
    options = {
      page: 0,
      // sortField: 'string',
      // vacancyName: 'string',
      // code: 'string',
      // // cityId: 0,
      // vacancyStateId: 'All',
      // vacancyTypeId: 'All',
      // multiUserId: 0,
      // sortDirection: 'string',
    }
  ) {
    const resp = await this.employerApi.post('/vacancy/list', options);
    const { vacancies } = resp.data;
    // console.log({data})
    return { vacancies };
  }
  async getApplies(
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
  async getResume({ resumeId }) {
    try {
      const response = await this.employerApi.get(`/resume/${resumeId}`);
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
  async getPublicationLeftOvers({ page }) {
    try {
      const response = await this.employerApi.get(`/api/service/list${page}`);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }
  async changeVacancyPublicationType({ vacancy, publishType }) {
    try {
      const {
        vacancyId,
        vacancyName,
        description,
        cityId,
        salary,
        designId,
        sendResumeType,
        contactEMail,
        endingType,
      } = vacancy;

      const response = await this.employerApi.post('/vacancy/add', {
        id: vacancyId,
        publishType,
        Name: vacancyName,
        description,
        cityId,
        salary,
        designId,
        sendResumeType,
        contactEMail,
        endingType,
      });
      devLog('request sent +', response);
      return response.data;
    } catch (error) {
      console.error(error);
    }
  }

  async getVacancyById({ vacancyId }) {
    try {
      const response = await this.employerApi.post(`/vacancy/get/${vacancyId}`);
      return response.data;
    } catch (error) {
      error.response.data.vacancyId = vacancyId;
      this.handleApiError(error);
    }
  }
  async changeVacancyState({ vacancyId, state }) {
    try {
      const { data } = await this.employerApi.post(
        `/vacancy/state/${vacancyId}?state=${state}`
      );
      devLog(data);
    } catch (error) {
      this.handleApiError(error);
    }
  }

  async getTicketRest({ ticketType }) {
    try {
      const response = await this.employerApi.get(
        `/api/service/tickets/${ticketType}`
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }
  async searchResumes(params = {}) {
    try {
      const defaultParams = {
        page: 0,
        count: 20,
        searchType: 'default', // or 'everywhere', 'speciality', 'skills'
        ukrainian: true,
        inside: false, // Include region
        showCvWithoutSalary: true,
        period: 'All', 
      };

      const requestParams = { ...defaultParams, ...params };

      const response = await this.employerApi.get('/cvdb/resumes', {
        params: requestParams,
      });
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
