import { cityListWithAssignedBy } from '../bitrix/bitrix.constants.mjs';
import { verifyIfBoltIdCorrect } from '../web.api/web.api.utlites.mjs';

export const checkIfDriverStaysInTheSameCity = async ({
  driver_id,
  city_id,
  auto_park_id,
}) => {
  const matchedCity = cityListWithAssignedBy.find(
    (city) => city.brandingId === city_id
  );
  const checkResult = auto_park_id === matchedCity.auto_park_id;
  console.log({ checkResult, matchedCity });
  return { checkResult };
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
