import { getFinishedRefferals } from "../bitrix.queries.mjs";
import { changeItemStage } from "../bitrix.utils.mjs";
import { referralTypeId } from "../bitrix.constants.mjs";

export async function moveReferralToClosed() {

    const { finishedRefferals } = await getFinishedRefferals();

    for (let referral of finishedRefferals) {

        const { referral_id } = referral

        await changeItemStage({
            referralTypeId,
            id: referral_id,
            stageId: 'DT1098_42:SUCCESS'
        })
    }

}