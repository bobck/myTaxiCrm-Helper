import { addCommentToEntity } from '../bitrix/bitrix.utils.mjs';
import { vacancyRequestTypeId } from './job-board.constants.mjs';

export const assignPayloadToVacancyApply = ({ applies, payload }) => {
  return applies.map((apply) => {
    for (const key in payload) {
      apply[key] = payload[key];
    }
    return apply;
  });
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
