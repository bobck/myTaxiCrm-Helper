import axios from 'axios';
import { devLog } from '../../shared/shared.utils.mjs';

class RobotaUaApiClient {
  constructor({ token, email, password }) {
    this.email = email;
    this.password = password;
    this.token = token;
    this.reinitializePromise = null;

    if (this.employerApi) {
      // Update existing axios instance Authorization header
      this.employerApi.defaults.headers.Authorization = `Bearer ${token}`;
    } else {
      // Create new axios instance
      this.employerApi = axios.create({
        baseURL: process.env.ROBOTA_UA_API,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
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
      const token = response.data;
      if (!token) {
        throw new Error('Token not found in login response.');
      }

      return new RobotaUaApiClient({
        token,
        email,
        password,
      });
    } catch (error) {
      console.error('Robota.ua Authentication failed.');
      if (error.response) {
        console.error(`Status: ${error.response.status}`, error.response.data);
      }
      throw error;
    }
  }

  async initialize({ email, password } = {}) {
    // Use provided credentials or fall back to instance credentials
    const authEmail = email || this.email;
    const authPassword = password || this.password;

    if (!authEmail || !authPassword) {
      throw new Error('Email and password are required for initialization.');
    }

    // Prevent concurrent reinitializations
    if (this.reinitializePromise) {
      return this.reinitializePromise;
    }

    const authApi = axios.create({
      baseURL: process.env.ROBOTA_UA_AUTH_API,
    });

    this.reinitializePromise = (async () => {
      try {
        devLog('Robota.ua reinitialization started');
        const response = await authApi.post('/Login', {
          username: authEmail,
          password: authPassword,
          remember: true,
        });
        const token = response.data;
        if (!token) {
          throw new Error('Token not found in login response.');
        }

        // Update instance with new token
        this.token = token;
        this.employerApi.defaults.headers.Authorization = `Bearer ${token}`;
        devLog('Robota.ua reinitialization successful');
      } catch (error) {
        console.error('Robota.ua reinitialization failed.');
        if (error.response) {
          console.error(
            `Status: ${error.response.status}`,
            error.response.data
          );
        }
        throw error;
      } finally {
        this.reinitializePromise = null;
      }
    })();

    return this.reinitializePromise;
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
    try {
      const resp = await this.employerApi.post('/vacancy/list', options);
      const { vacancies } = resp.data;
      return { vacancies };
    } catch (error) {
      await this.handleApiError(error);
    }
  }
  async getApplies(
    options = { vacancyId: 0, folderId: 0, page: 0, filter: '' }
  ) {
    try {
      const response = await this.employerApi.post('/apply/list', options);
      return response.data;
    } catch (error) {
      await this.handleApiError(error);
    }
  }

  async getResume({ resumeId }) {
    try {
      const response = await this.employerApi.get(`/resume/${resumeId}`);
      return response.data;
    } catch (error) {
      await this.handleApiError(error);
    }
  }
  async addOrEditVacancy(vacancyData) {
    try {
      const response = await this.employerApi.post('/vacancy/add', vacancyData);
      return response.data;
    } catch (error) {
      await this.handleApiError(error);
    }
  }
  async getPublicationLeftOvers({ page }) {
    try {
      const response = await this.employerApi.get(`/api/service/list${page}`);
      return response.data;
    } catch (error) {
      await this.handleApiError(error);
    }
  }
  async changeVacancyPublicationType({ vacancy, publishType }) {
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

    const requestData = {
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
    };

    try {
      const response = await this.employerApi.post('/vacancy/add', requestData);
      devLog('request sent +', response);
      return response.data;
    } catch (error) {
      await this.handleApiError(error);
    }
  }

  async getVacancyById({ vacancyId }) {
    try {
      const response = await this.employerApi.post(`/vacancy/get/${vacancyId}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        error.response.data.vacancyId = vacancyId;
      }
      await this.handleApiError(error);
    }
  }
  async changeVacancyState({ vacancyId, state }) {
    const validStates = ['Deleted', 'Closed', 'Publicated', 'NotPublicated'];
    if (!validStates.includes(state)) {
      throw new Error(
        `Invalid state: ${state}. Must be one of ${validStates.join(', ')}`
      );
    }

    try {
      const { data } = await this.employerApi.post(
        `/vacancy/state/${vacancyId}?state=${state}`
      );
      devLog(data);
    } catch (error) {
      await this.handleApiError(error);
    }
  }

  async getTicketRest({ ticketType }) {
    try {
      const response = await this.employerApi.get(
        `/api/service/tickets/${ticketType}`
      );
      return response.data;
    } catch (error) {
      await this.handleApiError(error);
    }
  }
  async handleApiError(error) {
    const status = error?.response?.status;

    // Handle 401 Unauthorized - reinitialize and let caller retry
    if (status === 401) {
      devLog('Robota.ua API Error: 401 Unauthorized - reinitializing');
      try {
        // Reinitialize to get new token
        await this.initialize();
        devLog(
          'Robota.ua reinitialization successful - caller should retry request'
        );
      } catch (reinitError) {
        console.error('Robota.ua reinitialization failed.');
        if (reinitError.response) {
          console.error(
            `Status: ${reinitError.response.status}`,
            reinitError.response.data
          );
        }
        throw reinitError;
      }
      // Throw the original error so caller can retry
      throw error;
    }

    // For non-401 errors, log and throw as before
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
