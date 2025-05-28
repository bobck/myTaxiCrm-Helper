import {
  getFinishedRefferals,
  getFinishedRefferalsProcentageReward,
  markReferralAsClosed,
} from '../bitrix.queries.mjs';
import { changeItemStage } from '../bitrix.utils.mjs';
import { referralTypeId } from '../bitrix.constants.mjs';
import { procentageRewardAutoParkIds } from '../bitrix.constants.mjs';

export async function moveReferralToClosed() {
  const { finishedRefferals } = await getFinishedRefferals({
    procentageRewardAutoParkIds,
  });
  console.log({
    message: 'moveReferralToClosed',
    date: new Date(),
    referrals: finishedRefferals.length,
  });
  for (let referral of finishedRefferals) {
    const { referral_id, created_at } = referral;
    try {
      await changeItemStage({
        referralTypeId,
        id: referral_id,
        stageId: 'DT1098_42:SUCCESS',
      });
      await markReferralAsClosed({ referral_id });
    } catch (error) {
      console.error({
        error,
        message: `error occured while moveReferralToClosed`,
        referral_id,
        created_at,
        date: new Date(),
      });
    }
  }

}
export async function moveReferralProcentageRewardToClosed() {
  const { finishedRefferalsProcentageReward } =
    await getFinishedRefferalsProcentageReward({ procentageRewardAutoParkIds });
  console.log({
    message: 'moveReferralProcentageRewardToClosed',
    date: new Date(),
    referrals: finishedRefferalsProcentageReward.length,
  });
  for (let referral of finishedRefferalsProcentageReward) {
    const { referral_id, created_at } = referral;
    try {
      await changeItemStage({
        referralTypeId,
        id: referral_id,
        stageId: 'DT1098_42:SUCCESS',
      });
      await markReferralAsClosed({ referral_id });
    } catch (error) {
      console.error({
        message: `error occured while moveReferralProcentageRewardToClosed`,
        referral_id,
        error,
        created_at,
        date: new Date(),
      });
      continue;
    }
  }
}

if (process.env.ENV == 'TEST') {
  console.log('testing referral movement ...');
  await moveReferralToClosed();
  await moveReferralProcentageRewardToClosed();
}
