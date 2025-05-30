import { api_status_codes } from '../api.constants.mjs';
import { setLetterApprovedByDealId } from '../../bitrix/bitrix.queries.mjs';

const { OK, BAD_REQUEST } = api_status_codes;

export const approveDriverLetterToBoltHandler = async (req, res) => {
  let { letter_id } = req.params;
  letter_id = Number(letter_id);
  console.log(req.params);
  const { bitrix_deal_id } = req.query;
  if (!(letter_id === 1 || letter_id === 2)) {
    res.status(BAD_REQUEST).json({ message: `unknown letter_id:${letter_id}` });
    return;
  }
  if (!bitrix_deal_id) {
    res.status(BAD_REQUEST).json({ message: 'bitrix_deal_id is required' });
    return;
  }
  const resp = await setLetterApprovedByDealId({ bitrix_deal_id, letter_id });
  if (!resp.bitrix_deal_id) {
    res
      .status(BAD_REQUEST)
      .json({ message: `bitrix_deal_id:${bitrix_deal_id} wasnt found` });
    return;
  }
  res.status(OK).json({
    message: `bitrix_deal_id:${bitrix_deal_id} letter_id:${letter_id} letter has been approved`,
  });
};
