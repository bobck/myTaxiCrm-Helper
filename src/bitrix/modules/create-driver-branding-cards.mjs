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

function computeBrandingCardStage(total_trips) {
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
function getCityBrandingId(auto_park_id) {
  return cityList.find((obj) => obj.auto_park_id === auto_park_id).brandingId;
}

export async function createDriverBrandingCards() {
  const bounds = computePeriodBounds();
  const brandingProcess = await createBrandingProcess({
    year: bounds.upperBound.year,
    weekNumber: bounds.upperBound.weekNumber,
    period_from: bounds.lowerBound.toISODate(),
    period_to: bounds.upperBound.toISODate(),
  });
  const { period_from, period_to } = brandingProcess;
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
    const { weekNumber, year } = brandingProcess;

    const dbcard = await getCrmBrandingCardByDriverId({
      driver_id,
      weekNumber,
      year,
    });
    if (dbcard) {
      console.error(
        `Present driver card while creating driver_id:${driver_id}, year:${year}, weekNumber:${weekNumber}`
      );
      continue;
    }
    const stage_id = `DT1158_70:${computeBrandingCardStage(total_trips)}`;
    const myTaxiDriverUrl = `https://fleets.mytaxicrm.com/${auto_park_id}/drivers/${driver_id}`;
    const cityBrandingId = getCityBrandingId(auto_park_id);
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
    const bitrixRespArr = await createBitrixDriverBrandingCards({
      cards: chunk,
    });
    const handledResponseArr = bitrixRespArr.reduce((acc, item) => {
      const { id, ufCrm54_1738757552: phone } = item['item'];
      const matchingCard = chunk.find((c) => c.phone === phone);
      acc.push({
        bitrix_card_id: id,
        driver_id: matchingCard.driver_id,
        total_trips: matchingCard.total_trips,
      });
      return acc;
    }, []);
    for (const respElement of handledResponseArr) {
      const { driver_id, total_trips, bitrix_card_id } = respElement;
      await insertBrandingCard({
        driver_id,
        total_trips,
        bitrix_card_id,
        branding_process_id: brandingProcess.id,
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
