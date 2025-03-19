import { getFiredDebtorDriversInfo } from '../../web.api/web.api.utlites.mjs';
import { cityListWithAssignedBy as cityList } from '../bitrix.constants.mjs';
import { openSShTunnel } from '../../../ssh.mjs';
import { getFiredDebtorDriverByWeekAndYear } from '../bitrix.queries.mjs';

function computeCardStage(total_trips) {
  let trips = Number(total_trips);
  if (isNaN(trips)) {
    console.error('Trips must be a number');
  }
  if (trips >= 90) {
    return 'PREPARATION';
  } else if (trips < 30) {
    return 'CLIENT';
  } else {
    return 'NEW';
  }
}

export async function createFiredDebtorDriversCards() {
  const { rows } = await getFiredDebtorDriversInfo();

  if (rows.length === 0) {
    console.error('No rows found for fired debtor drivers found.');
    return;
  }
  const processedCards = [];
  for (const [index, row] of rows.entries()) {
    if (
      process.env.ENV === 'TEST' &&
      index === Number(process.env.BRANDING_CARDS_COUNT)
    ) {
      break;
    }
    const {
      driver_id,
      full_name,
      auto_park_id,
      cs_current_week,
      cs_current_year,
      current_week_total_deposit,
      current_week_total_debt,
      fire_date,
      is_balance_enabled,
      balance_activation_value,
      is_deposit_enabled,
      deposit_activation_value
    }=row;



    const dbcard = await getFiredDebtorDriverByWeekAndYear({driver_id,cs_current_week, cs_current_year});
    if (dbcard) {

    }

  //   const { cityBrandingId } = getCityBrandingId({ auto_park_id });
  //   const stage_id = `DT1138_62:${computeBrandingCardInProgressStage({ total_trips, auto_park_id })}`;
  //   const myTaxiDriverUrl = `https://fleets.mytaxicrm.com/${auto_park_id}/drivers/${driver_id}`;
  //   const card = {
  //     driver_id,
  //     driver_name,
  //     stage_id,
  //     phone,
  //     myTaxiDriverUrl,
  //     total_trips,
  //     weekNumber,
  //     year,
  //     cityBrandingId,
  //     auto_park_id,
  //   };
  //   processedCards.push(card);
  // }
  // const chunkedProcessedCards = chunkArray(
  //   processedCards,
  //   Number(process.env.CHUNK_SIZE) || 7
  // );
  // for (const [index, chunk] of chunkedProcessedCards.entries()) {
  //   const bitrixRespObj = await createBitrixDriverBrandingCards({
  //     cards: chunk,
  //   });
  //   const handledResponseArr = [];
  //   for (const driver_id in bitrixRespObj) {
  //     const { id } = bitrixRespObj[driver_id]['item'];
  //     const matchingCard = chunk.find((c) => c.driver_id === driver_id);
  //     handledResponseArr.push({
  //       bitrix_card_id: id,
  //       driver_id: matchingCard.driver_id,
  //       total_trips: matchingCard.total_trips,
  //       auto_park_id: matchingCard.auto_park_id,
  //     });
  //   }
  //   for (const respElement of handledResponseArr) {
  //     const { driver_id, total_trips, bitrix_card_id, auto_park_id } =
  //       respElement;
  //     await insertBrandingCard({
  //       driver_id,
  //       total_trips,
  //       bitrix_card_id,
  //       branding_process_id,
  //       auto_park_id,
  //     });
  //   }
  }

  console.log(
    `${processedCards.length} branding cards creation has been finished.`
  );

}

if (process.env.ENV === 'TEST') {
  console.log(
    `testing fired debtor drivers creation\ncards count :${(process.env.DEBTOR_DRIVERS_CARDS_COUNT = 4)}`
  );
  await openSShTunnel;
  await createFiredDebtorDriversCards();
}
