import {
  getRobotaUaTokenToEnv,
  getVacanciesList,
  performLogin,
} from '../job-board.utils.mjs';
import fs from 'fs'; 
import path from 'path'; 
const logFilePath = path.join(process.cwd(), 'app.log'); 

const writeLog = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;
  try {
    fs.appendFileSync(logFilePath, logMessage); // Append to the log file
  } catch (err) {
    console.error('Failed to write to log file:', err); // Log to console if file logging fails
  }
};

export const robotaUaModule = async () => {
  writeLog('robotaUaModule started.');
  try {
    const jwt = await performLogin({
      username: process.env.ROBOTA_UA_EMAIL,
      password: process.env.ROBOTA_UA_PASSWORD,
    });
    writeLog('Login successful.'); 
    const vacanciesListGraphQLPayload = {
      operationName: 'GetVacanciesList',
      query:
        'query GetVacanciesList($first: Int, $after: String, $statuses: [VacancyStatus!], $closingBehaviors: [VacancyClosingBehavior!], $employerIds: [ID!], $cityIds: [ID!], $sortType: MyVacanciesSortType, $keyword: String) {\n  myVacancies(\n    first: $first\n    after: $after\n    filter: {statuses: $statuses, closingBehaviors: $closingBehaviors, employerIds: $employerIds, cityIds: $cityIds, keywords: $keyword}\n    sortType: $sortType\n  ) {\n    totalCount\n    edges {\n      node {\n        ...VacanciesListItem\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  totalVacancies: myVacancies(filter: {}) {\n    totalCount\n    __typename\n  }\n}\n\nfragment VacanciesListItem on Vacancy {\n  id\n  title\n  city {\n    id\n    name\n    __typename\n  }\n  address {\n    name\n    __typename\n  }\n  isPublicationInAllCities\n  currentPublicationService {\n    ...VacancyCurrentPublicationService\n    __typename\n  }\n  salary {\n    amount\n    currency\n    amountFrom\n    amountTo\n    __typename\n  }\n  sortDate\n  statusChangedAt\n  modifyDate\n  status\n  allowedVacancyActions\n  publicationType\n  publishPeriod {\n    begin\n    end\n    autoProlongEnd\n    daysUntilEnd\n    nextAutoProlongDate\n    __typename\n  }\n  hotPeriod {\n    begin\n    end\n    daysUntilEnd\n    __typename\n  }\n  closingType\n  positionRising {\n    last\n    leftTimes\n    leftDates\n    __typename\n  }\n  firstPublishedAt\n  owner {\n    fullName\n    id\n    __typename\n  }\n  contacts {\n    phones\n    photo\n    name\n    __typename\n  }\n  hasMyUnreviewedProlongationRequest\n  __typename\n}\n\nfragment VacancyCurrentPublicationService on CatalogService {\n  detailsUnion {\n    ...VacancyPublicationServiceDetails\n    ...VacancyPackageServiceDetails\n    __typename\n  }\n  __typename\n}\n\nfragment VacancyPublicationServiceDetails on VacancyPublicationCatalogService {\n  id\n  publicationType\n  vacancyMailingCount\n  vacancyRisingCount\n  supportedRegions {\n    id\n    __typename\n  }\n  typeWrapper {\n    id\n    type\n    __typename\n  }\n  __typename\n}\n\nfragment VacancyPackageServiceDetails on VacancyPackageCatalogService {\n  id\n  publicationType\n  vacancyMailingCount\n  vacancyRisingCount\n  supportedRegions {\n    id\n    __typename\n  }\n  typeWrapper {\n    id\n    type\n    __typename\n  }\n  __typename\n}\n',
      variables: {
        first: 20,
        after: 'MA==',
        statuses: [],
        employerIds: [],
        closingBehaviors: [],
        cityIds: [],
        keyword: '',
        sortType: 'BY_STATUS',
      },
    };

    const vacancies = await getVacanciesList(jwt, vacanciesListGraphQLPayload);
    console.log(vacancies)
  } catch (e) {
    writeLog(`Error in robotaUaModule: ${e.message}`); 
    if (e.stack) {
      writeLog(`Stack trace: ${e.stack}`); 
    }
  }
};

if (process.env.ENV === 'TEST') {
  writeLog('Running in TEST environment.');
  robotaUaModule()
    .then(() => {
      writeLog('robotaUaModule finished execution in TEST environment.');
    })
    .catch((err) => {
      writeLog(`Unhandled error during TEST execution: ${err.message}`);
    });
}
