import {
  getFinishedRefferals,
  getFinishedRefferalsProcentageReward,
} from '../bitrix.queries.mjs';
import {
  changeItemStage,
  createReferralItem,
  deleteReferralItem,
  getReferralItem,
} from '../bitrix.utils.mjs';
import { referralTypeId } from '../bitrix.constants.mjs';
import { procentageRewardAutoParkIds } from '../bitrix.constants.mjs';

export async function moveReferralToClosed() {
  const { finishedRefferals } = await getFinishedRefferals({
    procentageRewardAutoParkIds,
  });
  console.log({ finishedRefferals });
  for (let referral of finishedRefferals) {
    const { referral_id, created_at } = referral;
    try {
      await getReferralItem({ referralTypeId, referral_id });
    } catch (error) {
      console.error(
        `error occured while getting referral item, it probably doesnt exist ${referral_id}`,
        {
          referral_id,
          error,
          created_at,
          date: new Date(),
        }
      );
      continue;
    }
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
    await getFinishedRefferalsProcentageReward({ procentageRewardAutoParkIds });
  console.log({ finishedRefferalsProcentageReward });
  for (let referral of finishedRefferalsProcentageReward) {
    const { referral_id, created_at } = referral;
    try {
      await getReferralItem({ referralTypeId, referral_id });
    } catch (error) {
      console.error(
        `error occured while getting referral item, it probably doesnt exist ${referral_id}`,
        {
          referral_id,
          error,
          created_at,
          date: new Date(),
        }
      );
      continue;
    }
    await changeItemStage({
      referralTypeId,
      id: referral_id,
      stageId: 'DT1098_42:SUCCESS',
    });
  }
}

if (process.env.ENV == 'TEST') {
  console.log('testing referral movement ...');
  await moveReferralToClosed();
  await moveReferralProcentageRewardToClosed();
}
