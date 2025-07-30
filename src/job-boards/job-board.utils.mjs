import { dev } from '../api/modules/job-boards/job-board.service.mjs';
import { addCommentToEntity } from '../bitrix/bitrix.utils.mjs';
import { devLog } from '../shared/shared.utils.mjs';
import { vacancyRequestTypeId } from './job-board.constants.mjs';

export const assignPayloadToVacancyApply = ({ applies, payload }) => {
  return applies.map((apply) => {
    const a = Object.assign({}, apply, payload);

    return a;
    const newApply = structuredClone(apply);
    for (const key in payload) {
      newApply[key] = payload[key];
    }

    devLog({ newApply });
    return newApply;
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
