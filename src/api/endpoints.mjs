
import { DateTime } from 'luxon';
import { referralValidadion } from '../bitrix/modules/referral-validation.mjs';
import { referralTypeId } from '../bitrix/bitrix.constants.mjs';
import {
  saveRecruitDeal,
  saveReferralIdForRecruitDeal,
  approvalReferralById,
} from '../bitrix/bitrix.queries.mjs';
import {
  completeBitrixTaskById,
  addCommentToEntity,
} from '../bitrix/bitrix.utils.mjs';


