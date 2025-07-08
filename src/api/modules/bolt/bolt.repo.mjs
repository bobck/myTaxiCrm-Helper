import { setLetterApprovedByDealId } from '../../../bitrix/bitrix.queries.mjs';
import { getAllBoltIdsByDriverPhones } from '../../../web.api/web.api.utlites.mjs';
import { api_status_codes } from '../../api.constants.mjs';

const { BAD_REQUEST } = api_status_codes;

export const getDrivers = async ({ phones }) => {
  const { rows } = await getAllBoltIdsByDriverPhones({
    phones,
  });

  return { drivers: rows };
};
export const approveLetterByDealId = async ({ bitrix_deal_id, letter_id }) => {
  const letter_column =
    letter_id === 1 ? 'is_first_letter_approved' : 'is_second_letter_approved';
  await setLetterApprovedByDealId({ bitrix_deal_id, letter_column });
};
