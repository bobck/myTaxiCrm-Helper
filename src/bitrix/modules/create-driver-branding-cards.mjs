import { getBrandingCardsInfo } from '../../web.api/web.api.utlites.mjs';
import { DateTime } from 'luxon';
import {
  createBrandingProcess,
  getCrmBrandingCardByDriverId,
  insertBrandingCard,
} from '../bitrix.queries.mjs';
import {
  chunkArray,
  createBitrixDriverBrandingCards,
} from '../bitrix.utils.mjs';
import { cityListWithAssignedBy as cityList } from '../bitrix.constants.mjs';
import { openSShTunnel } from '../../../ssh.mjs';

export function computePeriodBounds() {
  const today = DateTime.local().startOf('day');

  const lowerBound = today.minus({ days: today.weekday });

  const upperBound = lowerBound.plus({ days: 7 });

  // Return the dates formatted as ISO strings (YYYY-MM-DD) for PostgreSQL
  return {
    lowerBound,
    upperBound,
  };
}

function computeBrandingCardStage({ total_trips, isKyivOrLviv }) {
  const trips = Number(total_trips);
  const today = DateTime.local().startOf('day');
  const maxGoalGap = 30 - (today.weekday - 5) * 10;
  if (isNaN(trips)) {
    console.error('Trips must be a number');
  }
  let GOAL = 60;

  if (isKyivOrLviv) {
    GOAL = 90;
  }
  const todaysTripsOptimalLowerBound = GOAL - maxGoalGap;
  if (trips >= GOAL) {
    return 'PREPARATION';
  } else if (trips < todaysTripsOptimalLowerBound) {
    return 'CLIENT';
  } else {
    return 'NEW';
  }
}
function getCityBrandingId(auto_park_id) {
  const matchingCity = cityList.find(
    (obj) => obj.auto_park_id === auto_park_id
  );
  const { brandingId: cityBrandingId } = matchingCity;
  const isKyivOrLviv = cityBrandingId === 3780 || cityBrandingId === 3756;
  return { cityBrandingId, isKyivOrLviv };
}

export async function createDriverBrandingCards() {
  const bounds = computePeriodBounds();
  const brandingProcess = await createBrandingProcess({
    year: bounds.upperBound.year,
    weekNumber: bounds.upperBound.weekNumber,
    period_from: bounds.lowerBound.toISODate(),
    period_to: bounds.upperBound.toISODate(),
  });
  const {
    period_from,
    period_to,
    id: branding_process_id,
    weekNumber,
    year,
  } = brandingProcess;
  const { rows } = await getBrandingCardsInfo({ period_from, period_to });

  if (rows.length === 0) {
    console.error('No rows found for branding cards found.');
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

    const { driver_id, driver_name, phone, auto_park_id, total_trips } = row;

    const dbcard = await getCrmBrandingCardByDriverId({
      driver_id,
      branding_process_id,
    });
    if (dbcard) {
      console.error(
        `Present driver card while creating driver_id:${driver_id}, year:${year}, weekNumber:${weekNumber}`
      );
      continue;
    }

    const { cityBrandingId, isKyivOrLviv } = getCityBrandingId(auto_park_id);
    const stage_id = `DT1138_62:${computeBrandingCardStage({ total_trips, isKyivOrLviv })}`;
    const myTaxiDriverUrl = `https://fleets.mytaxicrm.com/${auto_park_id}/drivers/${driver_id}`;
    const card = {
      driver_id,
      driver_name,
      stage_id,
      phone,
      myTaxiDriverUrl,
      total_trips,
      weekNumber,
      year,
      cityBrandingId,
    };
    processedCards.push(card);
  }
  const chunkedProcessedCards = chunkArray(
    processedCards,
    Number(process.env.CHUNK_SIZE) || 7
  );
  for (const [index, chunk] of chunkedProcessedCards.entries()) {
    const bitrixRespObj = await createBitrixDriverBrandingCards({
      cards: chunk,
    });
    const handledResponseArr = [];
    for (const driver_id in bitrixRespObj) {
      const { id } = bitrixRespObj[driver_id]['item'];
      const matchingCard = chunk.find((c) => c.driver_id === driver_id);
      handledResponseArr.push({
        bitrix_card_id: id,
        driver_id: matchingCard.driver_id,
        total_trips: matchingCard.total_trips,
      });
    }
    for (const respElement of handledResponseArr) {
      const { driver_id, total_trips, bitrix_card_id } = respElement;
      await insertBrandingCard({
        driver_id,
        total_trips,
        bitrix_card_id,
        branding_process_id,
      });
    }
  }

  console.log(
    `${processedCards.length} branding cards creation has been finished.`
  );
}

if (process.env.ENV === 'TEST') {
  console.log(
    `testing driver branding creation\ncards count: ${process.env.BRANDING_CARDS_COUNT}\nchunk size: ${process.env.CHUNK_SIZE}`
  );
  await openSShTunnel;
  await createDriverBrandingCards();
}
