import libphonenumber from 'google-libphonenumber';
import { cityListWithAssignedBy } from '../../../bitrix/bitrix.constants.mjs';

const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

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
