import { DateTime } from 'luxon';
import { getActiveRefferals } from '../bitrix.queries.mjs';
import { createPayment, addCommentToEntity } from '../bitrix.utils.mjs';
import { getDriverTripsCountByPeriod } from '../../web.api/web.api.utlites.mjs';
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

function findPeriodStartAndEnd({ created_date, days_passed }) {
  const createdAtDate = DateTime.fromFormat(created_date, 'yyyy-MM-dd');
  const periodEndDate = createdAtDate
    .plus({ days: days_passed - 1 })
    .toFormat('yyyy-MM-dd');

  if (days_passed == 3) {
    return {
      periodStartDate: createdAtDate.toFormat('yyyy-MM-dd'),
      periodEndDate,
      periodTarget: 50,
    };
  }

  if ([10, 17, 24, 31].includes(days_passed)) {
    const periodStartDate = createdAtDate
      .plus({ days: days_passed })
      .minus({ days: 7 })
      .toFormat('yyyy-MM-dd');
    return {
      periodStartDate,
      periodEndDate,
      periodTarget: 120,
    };
  }

  return {
    periodStartDate: null,
    periodEndDate: null,
    periodTarget: null,
  };
}

function getRefferalsForPay({ activeRefferals }) {
  const refferalsForPay = activeRefferals
    .map((refferal) => {
      const { created_date, days_passed } = refferal;

      const { periodStartDate, periodEndDate, periodTarget } =
        findPeriodStartAndEnd({
          created_date,
          days_passed,
        });

      return {
        ...refferal,
        periodStartDate,
        periodEndDate,
        periodTarget,
      };
    })
    .filter((refferal) => refferal.periodTarget);

  return { refferalsForPay };
}

async function getTripsForRefferals(refferalsForPay) {
  const refferalsWithTrips = [];

  for (let refferal of refferalsForPay) {
    const { driver_id, auto_park_id, periodStartDate, periodEndDate } =
      refferal;

    const { trips } = await getDriverTripsCountByPeriod({
      driver_id,
      auto_park_id,
      periodStartDate,
      periodEndDate,
    });
    refferalsWithTrips.push({
      ...refferal,
      trips,
    });
  }

  return { refferalsWithTrips };
}

export async function createRefferalPayment() {
  const date =
    manualDate || DateTime.now().setZone('Europe/Kyiv').toFormat('yyyy-MM-dd');

  const { activeRefferals } = await getActiveRefferals({
    date,
    procentageRewardAutoParkIds,
  });

  if (activeRefferals.length == 0) {
    return;
  }

  const { refferalsForPay } = getRefferalsForPay({
    activeRefferals,
  });

  console.log({
    time: new Date(),
    message: 'createRefferalPayment',
    date,
    activeRefferals: activeRefferals.length,
    refferalsForPay: refferalsForPay.length,
  });

  if (refferalsForPay.length == 0) {
    return;
  }

  const { refferalsWithTrips } = await getTripsForRefferals(refferalsForPay);

  const refferalsReadyForPay = refferalsWithTrips.filter(
    (refferal) => refferal.trips >= refferal.periodTarget
  );
  const refferalsNotEligible = refferalsWithTrips.filter(
    (refferal) => refferal.trips < refferal.periodTarget
  );

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
      days_passed,
      created_date,
      periodStartDate,
      periodEndDate,
      periodTarget,
      trips,
    } = refferal;

    console.log({
      referral: 'refferalsReadyForPay',
      referral_id,
      trips,
      periodTarget,
      created_date,
      days_passed,
      periodStartDate,
      periodEndDate,
    });

    const title = `${first_name} ${last_name} виплата 300 грн.`;
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

    const referralComment = `Реферальна програма: Кількість поїздок\nДодано виплату за період з ${periodStartDate} по ${periodEndDate}\nЦіль поїздок: ${periodTarget}\nВиконано поїздок: ${trips}\n\nПосилання на виплату:\nhttps://taxify.bitrix24.eu/page/referal/viplati/type/1102/details/${itemId}/`;

    await addCommentToEntity({
      entityId: referral_id,
      typeId: referralTypeId,
      comment: referralComment,
    });

    const paymentComment = `Нарахована винагорода для ${referrerName}, тел. ${referrerPhone}, у розмірі 300 грн., за реферала ${first_name} ${last_name}. В період з ${periodStartDate} по ${periodEndDate} зроблено ${trips} поїздок\n\nПосилання на картку реферала у MyTaxiCRM:\nhttps://fleets.mytaxicrm.com/${auto_park_id}/drivers/${driver_id}`;

    await addCommentToEntity({
      entityId: itemId,
      typeId: paymentsTypeId,
      comment: paymentComment,
    });
  }

  for (let refferal of refferalsNotEligible) {
    const {
      referral_id,
      days_passed,
      created_date,
      periodStartDate,
      periodEndDate,
      periodTarget,
      trips,
    } = refferal;

    console.log({
      referral: 'refferalsNotEligible',
      referral_id,
      trips,
      periodTarget,
      created_date,
      days_passed,
      periodStartDate,
      periodEndDate,
    });

    const comment = `Реферальна програма: Кількість поїздок\nНедостатньо поїздок для виплати бонусу за період з ${periodStartDate} по ${periodEndDate}\n\nЦіль поїздок: ${periodTarget}\nВиконано поїздок: ${trips}`;
    await addCommentToEntity({
      entityId: referral_id,
      typeId: referralTypeId,
      comment,
    });
  }
}

if (process.env.ENV == 'TEST') {
  await createRefferalPayment();
}
