import { cityListWithAssignedBy } from '../bitrix/bitrix.constants.mjs';
import { getAllBoltIdsByDriverPhone } from '../web.api/web.api.utlites.mjs';
import { api_status_codes } from './api.constants.mjs';

const { OK: SUCCESS_AUTH, BAD_REQUEST, MISSING_API_KEY } = api_status_codes;
export const checkIfDriverStaysInTheSameCity = async ({
  driver_id,
  city_id,
  auto_park_id,
}) => {
  const matchedCity = cityListWithAssignedBy.find(
    (city) => city.boltVerificationId === city_id
  );
  const checkResult = auto_park_id === matchedCity?.auto_park_id;
  let actualCityId = matchedCity?.boltVerificationId;
  if (matchedCity) {
    return { checkResult, actualCityId };
  }
  const actualCity = cityListWithAssignedBy.find(
    (city) => city.auto_park_id === auto_park_id
  );
  actualCityId = actualCity?.boltVerificationId;

  return { checkResult, actualCityId };
};
export const handleDriverPhone = ({ phone }) => {
  const filteredPhone = String(phone).replaceAll(/[^0-9]/g, '');
  const isUkrainianPhone = filteredPhone.startsWith('380');
  const isPolishPhone = filteredPhone.startsWith('48');
  let handledPhone;
  if (isUkrainianPhone) {
    handledPhone = filteredPhone.slice(3);
  } else if (isPolishPhone) {
    handledPhone = filteredPhone.slice(2);
  } else {
    return {
      code: 400,
      status: 'error',
      error: {
        message: 'Phone number is not valid. It should be Ukrainian or Polish',
        phone,
      },
    };
  }
  if (handledPhone.length !== 9) {
    return {
      code: 400,
      status: 'error',
      error: {
        message: 'Phone number length is not valid.',
        phone,
      },
    };
  }
  const phoneReadyToQuery = `%${handledPhone}%`;
  return {
    code: 200,
    status: 'ok',
    phoneReadyToQuery,
  };
};
export const authorizeAPIClient = ({ api_key }) => {
  let auth_result;
  if (api_key === null || api_key === undefined) {
    auth_result = {
      code: MISSING_API_KEY,
      status: 'error',
      message:
        'unauthorized request attemption. Please pass the api_key query parameter',
    };
  } else if (api_key !== process.env.MYTAXICRM_HELPER_API_KEY) {
    auth_result = {
      code: BAD_REQUEST,
      status: 'error',
      message: 'wrong api_key',
    };
  } else {
    auth_result = {
      code: SUCCESS_AUTH,
      status: 'ok',
      message: 'successfull authorization',
    };
  }
  return auth_result;
};
