import { addCommentToEntity } from '../bitrix/bitrix.utils.mjs';
import { vacancyRequestTypeId } from './job-board.constants.mjs';

export const assignVacancyTitleToApplies = ({
  applies,
  title,
  bitrix_city_id,
}) => {
  return applies.map((apply) => ({ ...apply, title, bitrix_city_id }));
};
export const reportBitrixEntityError = async ({
  comment,
  bitrix_id,
  typeId,
}) => {
  if (!(bitrix_id && typeId && comment)) {
    throw new Error('unknown kind of error');
  }
  await addCommentToEntity({ comment, entityId: bitrix_id, typeId });
};
