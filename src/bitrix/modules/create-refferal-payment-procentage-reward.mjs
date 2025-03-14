import { DateTime } from 'luxon';
import { getActiveRefferalsProcentageReward } from '../bitrix.queries.mjs';
import { createPayment, addCommentToEntity } from '../bitrix.utils.mjs';
import { getRevenueDetailsForRefferalsProcentageReward } from '../../web.api/web.api.utlites.mjs';
import {
  referralTypeId,
  paymentsStageId,
  paymentsTypeId,
  cityTextRecruitToPayments,
  positionTextReferralsToPayments,
  procentageRewardAutoParkIds,
} from '../bitrix.constants.mjs';

const param = process.argv.find((arg) => arg.startsWith('--manual_date='));
const manualDate = param ? param.split('=')[1] : null;

const param2 = process.argv.find((arg) => arg.startsWith('--manual_week='));
const manualWeek = param2 ? param2.split('=')[1] : null;

const param3 = process.argv.find((arg) => arg.startsWith('--manual_year='));
const manualYear = param3 ? param3.split('=')[1] : null;

const weeklyTargetMarkers = {
  Monday: 9000,
  Tuesday: 9000,
  Wednesday: 7500,
  Thursday: 6000,
  Friday: 4500,
  Saturday: 3000,
  Sunday: 1500,
};

const rewardProcentage = 0.03;

function getRefferalsForPayProcentageReward({
  activeRefferals,
  revenueDetails,
  week,
  year,
}) {
  const refferalsNotEligible = [];
  const refferalsReadyForPay = [];

  for (let referral of activeRefferals) {
    const { created_date, driver_id } = referral;

    const createdAtDate = DateTime.fromFormat(created_date, 'yyyy-MM-dd');
    const createdAtWeek = createdAtDate.weekNumber;
    const createdAtYear = createdAtDate.year;

    const revenueDetail = revenueDetails.find(
      (revenue) => revenue.driver_id === driver_id
    );

    if (createdAtWeek == week && createdAtYear == year) {
      const createdAtWeekDay = createdAtDate.toFormat('cccc');
      const targetMarker = weeklyTargetMarkers[createdAtWeekDay];

      if (revenueDetail && revenueDetail.driver_revenue >= targetMarker) {
        const rewardAmount = Math.round(
          revenueDetail.driver_revenue * rewardProcentage
        );
        refferalsReadyForPay.push({
          ...referral,
          ...revenueDetail,
          targetMarker,
          rewardAmount,
        });
        continue;
      }

      if (revenueDetail && revenueDetail.driver_revenue < targetMarker) {
        refferalsNotEligible.push({
          ...referral,
          ...revenueDetail,
          targetMarker,
        });
        continue;
      }
    }

    const targetMarker = weeklyTargetMarkers['Monday'];

    if (revenueDetail && revenueDetail.driver_revenue >= targetMarker) {
      const rewardAmount = Math.round(
        revenueDetail.driver_revenue * rewardProcentage
      );
      refferalsReadyForPay.push({
        ...referral,
        ...revenueDetail,
        targetMarker,
        rewardAmount,
      });
      continue;
    }

    refferalsNotEligible.push({ ...referral, ...revenueDetail, targetMarker });
    continue;
  }

  return { refferalsReadyForPay, refferalsNotEligible };
}

export async function createRefferalPaymentProcentageReward() {
  const date =
    manualDate || DateTime.now().setZone('Europe/Kyiv').toFormat('yyyy-MM-dd');

  const pastWeekDate = DateTime.now().setZone('Europe/Kyiv').minus({ days: 1 });
  const week = manualWeek || pastWeekDate.weekNumber;
  const year = manualYear || pastWeekDate.year;

  const { activeRefferals } = await getActiveRefferalsProcentageReward({
    date,
    procentageRewardAutoParkIds,
  });

  if (activeRefferals.length == 0) {
    return;
  }

  console.log({
    time: new Date(),
    message: 'createRefferalPaymentProcentageReward',
    date,
    week,
    year,
    activeRefferals: activeRefferals.length,
  });

  const activeRefferalsIds = activeRefferals.map((r) => r.driver_id);

  const { rows: revenueDetails } =
    await getRevenueDetailsForRefferalsProcentageReward({
      activeRefferalsIds,
      week,
      year,
    });
  const { refferalsReadyForPay, refferalsNotEligible } =
    getRefferalsForPayProcentageReward({
      activeRefferals,
      revenueDetails,
      week,
      year,
    });

  for (let refferal of refferalsReadyForPay) {
    const {
      driver_id,
      auto_park_id,
      referral_id,
      first_name,
      last_name,
      contact_id,
      referrer_phone,
      referrer_name,
      referrer_position,
      city_id,
      created_date,
      rewardAmount,
      targetMarker,
      driver_revenue,
    } = refferal;

    console.log({
      referral: 'refferalsReadyForPay',
      referral_id,
      week,
      year,
      created_date,
    });

    const title = `${first_name} ${last_name} виплата ${rewardAmount} грн.`;
    const contactId = contact_id;

    const city = cityTextRecruitToPayments[city_id]?.id;
    const assignedBy = cityTextRecruitToPayments[city_id]?.assigned_by_id;
    const referrerPhone = referrer_phone;
    const referrerName = referrer_name;
    const referrerPosition = positionTextReferralsToPayments[referrer_position];

    const { id: itemId } = await createPayment({
      title,
      stageId: paymentsStageId,
      city,
      contactId,
      assignedBy,
      referrerPhone,
      referrerName,
      referrerPosition,
    });

    const referralComment = `Реферальна програма: 3% від Загального Доходу\nДодано виплату за тиждень ${week}, ${year} року.\nЦіль загального доходу: ${targetMarker}\nЗагальний дохід реферала: ${driver_revenue}\n\nПосилання на виплату:\nhttps://taxify.bitrix24.eu/page/referal/viplati/type/1102/details/${itemId}/`;

    await addCommentToEntity({
      entityId: referral_id,
      typeId: referralTypeId,
      comment: referralComment,
    });

    const paymentComment = `Нарахована винагорода для ${referrerName}, тел. ${referrerPhone}, у розмірі ${rewardAmount} грн., за реферала ${first_name} ${last_name}. За тиждень ${week}, ${year} року. Загальний дохід реферала ${driver_revenue} грн. Ціль загального доходу: ${targetMarker} грн.\n\nПосилання на картку реферала у MyTaxiCRM:\nhttps://fleets.mytaxicrm.com/${auto_park_id}/drivers/${driver_id}`;

    await addCommentToEntity({
      entityId: itemId,
      typeId: paymentsTypeId,
      comment: paymentComment,
    });
  }

  for (let refferal of refferalsNotEligible) {
    const { referral_id, created_date, targetMarker, driver_revenue } =
      refferal;

    console.log({
      referral: 'refferalsNotEligible',
      referral_id,
      created_date,
      week,
      year,
    });

    const comment = `Реферальна програма: 3% від Загального Доходу\nНедостатньо Загального доходу для виплати бонусу за тиждень ${week}, ${year} року.\n\nЦіль загального доходу: ${targetMarker}\nЗагальний дохід реферала: ${driver_revenue}`;
    await addCommentToEntity({
      entityId: referral_id,
      typeId: referralTypeId,
      comment,
    });
  }
}

if (process.env.ENV == 'TEST') {
  await createRefferalPaymentProcentageReward();
}
