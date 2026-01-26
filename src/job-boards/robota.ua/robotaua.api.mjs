import axios from 'axios';
import { devLog } from '../../shared/shared.utils.mjs';

class RobotaUaApiClient {
  constructor({ token, email, password, maxReauthRetries }) {
    this.email = email;
    this.password = password;
    this.token = token;
    this.maxReauthRetries = maxReauthRetries;
    this.reauthPromise = null;

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
      const token = response.data;
      if (!token) {
        throw new Error('Token not found in login response.');
      }

      const maxReauthRetries =
        Number(process.env.ROBOTA_UA_MAX_REAUTH_RETRIES) || 1;

      return new RobotaUaApiClient({
        token,
        email,
        password,
        maxReauthRetries,
      });
    } catch (error) {
      console.error('Robota.ua Authentication failed.');
      if (error.response) {
        console.error(`Status: ${error.response.status}`, error.response.data);
      }
      throw error;
    }
  }

  async _reauthorize() {
    if (this.reauthPromise) {
      return this.reauthPromise;
    }

    const authApi = axios.create({
      baseURL: process.env.ROBOTA_UA_AUTH_API,
    });

    this.reauthPromise = (async () => {
      try {
        devLog('Robota.ua reauthorization started');
        const response = await authApi.post('/Login', {
          username: this.email,
          password: this.password,
          remember: true,
        });

        const newToken = response.data;
        if (!newToken) {
          throw new Error('Token not found in login response during reauth.');
        }

        this.token = newToken;
        this.employerApi.defaults.headers.Authorization = `Bearer ${newToken}`;
        devLog('Robota.ua reauthorization successful');
      } catch (error) {
        console.error('Robota.ua reauthorization failed.');
        if (error.response) {
          console.error(
            `Status: ${error.response.status}`,
            error.response.data
          );
        } else {
          console.error('An unexpected error occurred:', error.message);
        }
        throw error;
      } finally {
        this.reauthPromise = null;
      }
    })();

    return this.reauthPromise;
  }

  async _requestWithReauth(requestFn, attempt = 0) {
    try {
      return await requestFn();
    } catch (error) {
      const status = error?.response?.status;

      if (status === 401 && attempt < (this.maxReauthRetries ?? 1)) {
        await this._reauthorize();
        return this._requestWithReauth(requestFn, attempt + 1);
      }

      this.handleApiError(error);
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
    const resp = await this._requestWithReauth(() =>
      this.employerApi.post('/vacancy/list', options)
    );
    const { vacancies } = resp.data;
    return { vacancies };
  }
  async getApplies(
    options = { vacancyId: 0, folderId: 0, page: 0, filter: '' }
  ) {
    const response = await this._requestWithReauth(() =>
      this.employerApi.post('/apply/list', options)
    );

    return response.data;
  }

  async getResume({ resumeId }) {
    const response = await this._requestWithReauth(() =>
      this.employerApi.get(`/resume/${resumeId}`)
    );
    return response.data;
  }
  async addOrEditVacancy(vacancyData) {
    const response = await this._requestWithReauth(() =>
      this.employerApi.post('/vacancy/add', vacancyData)
    );
    return response.data;
  }
  async getPublicationLeftOvers({ page }) {
    const response = await this._requestWithReauth(() =>
      this.employerApi.get(`/api/service/list${page}`)
    );
    return response.data;
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

    const response = await this._requestWithReauth(() =>
      this.employerApi.post('/vacancy/add', {
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
      })
    );
    devLog('request sent +', response);
    return response.data;
  }

  async getVacancyById({ vacancyId }) {
    const response = await this._requestWithReauth(() =>
      this.employerApi.post(`/vacancy/get/${vacancyId}`)
    );
    return response.data;
  }
  async changeVacancyState({ vacancyId, state }) {
    const validStates = ['Deleted', 'Closed', 'Publicated', 'NotPublicated'];
    if (!validStates.includes(state)) {
      throw new Error(
        `Invalid state: ${state}. Must be one of ${validStates.join(', ')}`
      );
    }

    const { data } = await this._requestWithReauth(() =>
      this.employerApi.post(`/vacancy/state/${vacancyId}?state=${state}`)
    );
    devLog(data);
  }

  async getTicketRest({ ticketType }) {
    const response = await this._requestWithReauth(() =>
      this.employerApi.get(`/api/service/tickets/${ticketType}`)
    );
    return response.data;
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
