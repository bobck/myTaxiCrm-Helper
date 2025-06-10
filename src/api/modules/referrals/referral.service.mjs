
import { DateTime } from 'luxon';

import { referralValidadion } from '../../../bitrix/modules/referral-validation.mjs';
import {
  approvalReferralById,
  saveReferralIdForRecruitDeal,
  saveRecruitDeal,
} from '../../../bitrix/bitrix.queries.mjs';
import {
  addCommentToEntity,
  completeBitrixTaskById,
} from '../../../bitrix/bitrix.utils.mjs';
import { referralTypeId } from '../../../bitrix/bitrix.constants.mjs';

export const add = async ({ query }) => {
  const { referral_id, deal_id, task_id } = query;

  console.log({ message: 'POST: referral-add', query });

  await saveReferralIdForRecruitDeal({
    deal_id,
    referral_id,
    task_id,
  });
};
export const validate = async ({ query }) => {
  const {
    task_id,
    doc_id,
    first_name,
    last_name,
    contract,
    deal_id,
    contact_id,
    assigned_by_id,
    city_id,
  } = query;

  console.log({ message: 'POST: referral-validation', query });

  const isValid = await referralValidadion({
    task_id,
    doc_id,
    first_name,
    last_name,
    contract,
    deal_id,
    contact_id,
    assigned_by_id,
    city_id,
  });

  if (!isValid) {
    throw new Error({ message: 'invalid referral' });
  }
  const { auto_park_id, id } = isValid;
  try {
    const expiryAfter7DaysPeriod = DateTime.now()
      .plus({ days: 31 })
      .toFormat('yyyy-MM-dd HH:mm:ss');
    const expiryAfterprocentageReward = DateTime.now()
      .plus({ weeks: 5 })
      .toFormat('yyyy-MM-dd HH:mm:ss');

    await saveRecruitDeal({
      task_id,
      doc_id,
      first_name,
      last_name,
      contract,
      deal_id,
      auto_park_id,
      driver_id: id,
      expiry_after: expiryAfter7DaysPeriod,
      procent_reward_expiry_after: expiryAfterprocentageReward,
      contact_id,
      assigned_by_id,
      city_id,
    });

    await completeBitrixTaskById({ task_id });
  } catch (e) {
    const message = 'Unable to complete Bitrix Task';
    console.error({ deal_id, message, e });
    throw new Error({ message });
  }
};

export const approve = async ({ query }) => {
  const { referral_id, referrer_phone, referrer_name, referrer_position } =
    query;

  console.log({ message: 'POST: referral-approval', query });

  //TODO: move to module and pass crm link to referral card. Add validation if not exist
  await approvalReferralById({
    referral_id,
    referrer_phone,
    referrer_name,
    referrer_position,
  });

  const comment = `Реферал успішно додано до програми`;

  await addCommentToEntity({
    entityId: referral_id,
    typeId: referralTypeId,
    comment,
  });
};
