import {
  getFinishedRefferals,
  getFinishedRefferalsProcentageReward,
} from '../bitrix.queries.mjs';
import { changeItemStage } from '../bitrix.utils.mjs';
import { referralTypeId } from '../bitrix.constants.mjs';
import { procentageRewardAutoParkIds } from '../bitrix.constants.mjs';

export async function moveReferralToClosed() {
  const { finishedRefferals } = await getFinishedRefferals({
    procentageRewardAutoParkIds,
  });

  for (let referral of finishedRefferals) {
    const { referral_id } = referral;

    await changeItemStage({
      referralTypeId,
      id: referral_id,
      stageId: 'DT1098_42:SUCCESS',
    });
  }

  //TODO: add is_closed Boolean column
}

export async function moveReferralProcentageRewardToClosed() {
  const { finishedRefferalsProcentageReward } =
    await getFinishedRefferalsProcentageReward({
      procentageRewardAutoParkIds,
    });

  for (let referral of finishedRefferalsProcentageReward) {
    const { referral_id } = referral;

    await changeItemStage({
      referralTypeId,
      id: referral_id,
      stageId: 'DT1098_42:SUCCESS',
    });
  }
}

if (process.env.ENV == 'TEST') {
  await moveReferralToClosed();
  await moveReferralProcentageRewardToClosed();
}
