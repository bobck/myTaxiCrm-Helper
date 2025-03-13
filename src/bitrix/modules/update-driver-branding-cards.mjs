import { DateTime } from 'luxon';
import {
  getBrandingProcessByWeekNumber,
  getCrmBrandingCardByDriverId,
  updateBrandingCardByDriverId,
} from '../bitrix.queries.mjs';
import {
  chunkArray,
  updateBitrixDriverBrandingCards,
} from '../bitrix.utils.mjs';
import { getBrandingCardsInfo } from '../../web.api/web.api.utlites.mjs';
import { openSShTunnel } from '../../../ssh.mjs';

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

export async function updateDriverBrandingCards() {
  const today = DateTime.local().startOf('day');
  const brandingProcess = await getBrandingProcessByWeekNumber({
    weekNumber: today.weekNumber,
    year: today.year,
  });
  const {
    period_from,
    period_to,
    weekNumber,
    year,
    id: brandingProcessId,
  } = brandingProcess;
  const { rows } = await getBrandingCardsInfo({
    period_from,
    period_to,
  });
  const processedCards = [];

  for (const [index, row] of rows.entries()) {
    if (
      process.env.ENV === 'TEST' &&
      index === Number(process.env.BRANDING_CARDS_COUNT)
    ) {
      break;
    }
    const { driver_id, total_trips } = row;
    const { weekNumber, year } = brandingProcess;
    const dbcard = await getCrmBrandingCardByDriverId({
      driver_id,
      weekNumber,
      year,
    });
    if (!dbcard) {
      console.error(
        `Absent driver card while updating driver_id: ${driver_id}, year:${year}, weekNumber:${weekNumber} `
      );
      continue;
    }
    if (!Number(dbcard.total_trips) >= Number(total_trips)) {
      continue;
    }

    const stage_id = `DT1138_62:${computeBrandingCardStage(total_trips)}`;
    const card = {
      driver_id,
      bitrix_card_id: dbcard.bitrix_card_id,
      stage_id,
      total_trips,
    };
    processedCards.push(card);
  }

  const chunkedProcessedCards = chunkArray(
    processedCards,
    Number(process.env.CHUNK_SIZE) || 7
  );

  for (const [index, chunk] of chunkedProcessedCards.entries()) {
    const bitrixRespObj = await updateBitrixDriverBrandingCards({
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
      const { driver_id, total_trips } = respElement;

      const dbupdate = await updateBrandingCardByDriverId({
        branding_process_id: brandingProcess.id,
        driver_id,
        total_trips,
      });
    }
  }

  console.log(
    `${processedCards.length} branding cards updating has been finished.`
  );
}
if (process.env.ENV === 'TEST') {
  console.log(
    `testing driver branding updating\ncards count: ${process.env.BRANDING_CARDS_COUNT}\nchunk size: ${process.env.CHUNK_SIZE}`
  );
  await openSShTunnel;
  await updateDriverBrandingCards();
}
