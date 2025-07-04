import googleLibphonenumber from 'google-libphonenumber';
import { cityListWithAssignedBy } from '../bitrix/bitrix.constants.mjs';
import { getAllBoltIdsByDriverPhones } from '../web.api/web.api.utlites.mjs';
import { api_status_codes } from './api.constants.mjs';

const { PhoneNumberUtil } = googleLibphonenumber;
const phoneUtil = PhoneNumberUtil.getInstance();
const {
  OK: SUCCESS_AUTH,
  BAD_REQUEST,
  MISSING_API_KEY,
  INTERNAL_SERVER_ERROR,
} = api_status_codes;
export const controllerWrapper = ({ handlerCB, handlingServiceName }) => {
  return async (req, res) => {
    try {
      await handlerCB(req, res);
    } catch (error) {
      console.error(`error occured in ${handlingServiceName}`, error);
      const { code, message } = error;
      if (error instanceof Error) {
        res
          .status(INTERNAL_SERVER_ERROR)
          .json({ message: 'Internal Server Error', status: 'error' });
        return;
      }
      res.status(code).json({ message, status: 'error' });
    }
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

export const handleDriverPhones = ({ phones }) => {
  const phonesReadyToQuery = [];
  for (const phone of phones) {
    const numberProto = phoneUtil.parse(
      phone[0] === ' ' ? `+${phone.slice(1)}` : `+${phone}`
    );
    if (!phoneUtil.isValidNumber(numberProto)) {
      continue;
    }
    acc++;

    const nationalNumber = numberProto.getNationalNumber();
    phonesReadyToQuery.push(`%${nationalNumber}%`);
  }
  if (phonesReadyToQuery.length === 0) {
    throw new Error({
      code: BAD_REQUEST,
      message: 'None of the provided phone numbers are valid',
    });
  }
  return { phonesReadyToQuery };
};
