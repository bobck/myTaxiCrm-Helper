import { setLetterApprovedByDealId } from '../../../bitrix/bitrix.queries.mjs';
import { getAllBoltIdsByDriverPhone } from '../../../web.api/web.api.utlites.mjs';

export const getDrivers = async ({ phone, bolt_id }) => {
  const { rows } = await getAllBoltIdsByDriverPhone({
    phone,
    bolt_id,
  });

  if (!rows || rows.length === 0) {
    throw {
      code: BAD_REQUEST,
      message: "Any bolt ID wasn't found",
    };
  }
  return { drivers: rows };
};
export const approveLetterByDealId = async ({ bitrix_deal_id, letter_id }) => {
  const letter_column =
    letter_id === 1 ? 'is_first_letter_approved' : 'is_second_letter_approved';
  await setLetterApprovedByDealId({ bitrix_deal_id, letter_column });
};
