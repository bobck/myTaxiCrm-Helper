import axios from 'axios';
import { Buffer } from 'buffer'; // Import Buffer for Node.js environment
import { devLog } from '../../shared/shared.utils.mjs';

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

  async getVacancyById({ vacancyId }) {
    const queryParams = `?id=${vacancyId}&all=1`;
    const requestLocation = `/jobs/my/`;
    const requestUrl = requestLocation + queryParams;
    const { data } = await this.api.get(requestUrl);
    return data;
  }

  /**
   * Activates a vacancy by setting its publication type and other required fields.
   * This method uses a PUT request to update the vacancy.
   *
   * @param {object} params - The parameters for activating the vacancy.
   * @param {object} params.vacancy - An object containing vacancy details.
   * @param {string} params.vacancy.work_ua_vacancy_id - The ID of the vacancy to activate.
   * @param {string} params.vacancy.publicationType - The type of publication (e.g., 'standart_job').
   * @param {number} params.vacancy.region - The numeric ID of the region.
   * @param {number} params.vacancy.experience - The numeric ID of the experience level.
   * @param {string} params.vacancy.jobtype - A JSON string representing an array of job type IDs (e.g., '["74"]').
   * @param {string} params.vacancy.category - A JSON string representing an array of category IDs (e.g., '["22","25"]').
   * @param {string} params.vacancy.description - The description of the vacancy.
   * @param {string} params.vacancy.name - The name/title of the vacancy.
   * @returns {Promise<void>} A promise that resolves when the vacancy is successfully activated.
   */
  async activateVacancy({ vacancy }) {
    try {
      const {
        work_ua_vacancy_id,
        publicationType,
        region,
        experience,
        jobtype,
        category,
        description,
        name,
      } = vacancy;

      // Parse jobtype and category strings into arrays of numbers
      const jobtypeParsed = JSON.parse(jobtype); // e.g., [74]
      const categoryParsed = JSON.parse(category); // e.g., [22, 25]

      const body = new URLSearchParams();
      body.append('publication', publicationType);
      body.append('description', description);
      body.append('name', name);

      // Append region and experience with the [id] suffix as required by the API
      // Ensure region and experience are not null/undefined before appending
      if (region !== null && region !== undefined) {
        body.append('region[id]', region);
      } else {
        console.warn(
          'Region is missing or null. This might cause an API error.'
        );
      }

      if (experience !== null && experience !== undefined) {
        body.append('experience[id]', experience);
      } else {
        console.warn(
          'Experience is missing or null. This might cause an API error.'
        );
      }

      // Append jobtype and category as arrays of objects with [id] suffix
      // The API expects format like jobtype[0][id]=X&jobtype[1][id]=Y
      if (jobtypeParsed && jobtypeParsed.length > 0) {
        jobtypeParsed.forEach((id, index) => {
          body.append(`jobtype[${index}][id]`, id);
        });
      } else {
        console.warn(
          'Job type is missing or empty. This might cause an API error.'
        );
      }

      if (categoryParsed && categoryParsed.length > 0) {
        categoryParsed.forEach((id, index) => {
          body.append(`category[${index}][id]`, id);
        });
      } else {
        console.warn(
          'Category is missing or empty. This might cause an API error.'
        );
      }

      // Send the PUT request
      const response = await this.api.put(`/jobs/${work_ua_vacancy_id}`, body, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      // The API typically returns 204 No Content for successful PUT operations
      // so 'response.data' might be empty.
      console.log(
        `Vacancy ${work_ua_vacancy_id} activated with publication type: ${publicationType}. Response status: ${response.status}`
      );
    } catch (error) {
      console.log('error occurred while activating vacancy');
      console.log(error.response.data);
      // Delegate error handling to the centralized handleApiError method
      // this.handleApiError(error);
    }
  }

  async deactivateVacancy({ vacancyId }) {
    try {
      // The API expects Content-Length: 0 for empty PUT bodies.
      await this.api.put(`/jobs/${vacancyId}/close`, null, {
        headers: {
          'Content-Length': '0',
        },
      });
      console.log(`Vacancy ${vacancyId} deactivated.`);
    } catch (error) {
      console.log('error occurred while deactivating vacancy');
      console.log(error.response.data);
      // this.handleApiError(error);
    }
  }
  async getDictionary({ location }) {
    const { data } = await this.api.get(`/dictionaries/${location}`);

    return data;
  }
  async getAvailablePublications() {
    const { data } = await this.api.get('/available-publications');
    return { availablePublications: data };
  }
  handleApiError(error) {
    if (error.response) {
      switch (error.response.status) {
        case 400:
          console.error(
            'API Error: 400 Bad Request. The request was malformed or invalid.'
          );
          if (error.response.data && error.response.data.errors) {
            console.error('Specific API Errors:');
            error.response.data.errors.forEach((err) => {
              console.error(`  - ID: ${err.id}, Message: ${err.message}`);
            });
          }
          break;
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
      // Ensure error.response.data is logged only if it exists and hasn't been specifically handled
      if (
        error.response.data &&
        (error.response.status !== 400 || !error.response.data.errors)
      ) {
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
