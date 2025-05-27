import {
  getFinishedRefferals,
  getFinishedRefferalsProcentageReward,
  getReferralIds,
} from '../bitrix.queries.mjs';
import {
  changeItemStage,
  getAllReferrals,
  getReferralItem,
} from '../bitrix.utils.mjs';
import { referralTypeId } from '../bitrix.constants.mjs';
import { procentageRewardAutoParkIds } from '../bitrix.constants.mjs';

export async function moveReferralToClosed() {
  const { finishedRefferals } = await getFinishedRefferals({
    procentageRewardAutoParkIds,
  });
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
  // await moveReferralToClosed();
  // await moveReferralProcentageRewardToClosed();
  const bitrix_data = await getAllReferrals({
    referralTypeId,
    selectFields: ['id'],
  });
  const db_data = await getReferralIds();
  const missed_ids = db_data.reduce((acc, curr) => {
    const { referral_id } = curr;

    const bitrix_referral = bitrix_data.find((ref) => ref.id == referral_id);
    if (!bitrix_referral) acc.push(referral_id);
    return acc;
  }, []);

  console.log({ missed_ids });
}
