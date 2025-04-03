import { getBrandingCardsInfo } from '../../web.api/web.api.utlites.mjs';
import { DateTime } from 'luxon';
import {
  getBrandingProcessByWeekNumber,
  getCrmBrandingCardByDriverId,
  resolveBrandingProcessById,
  updateBrandingCardByDriverId,
} from '../bitrix.queries.mjs';
import {
  chunkArray,
  updateBitrixDriverBrandingCards,
} from '../bitrix.utils.mjs';
import { openSShTunnel } from '../../../ssh.mjs';
import { computeBrandingCardFinishedStage } from '../bitrix.business-entity.mjs';

export async function moveDriverBrandingCards() {
  const yesterday = DateTime.local().startOf('day').minus({ days: 1 });
  const brandingProcess = await getBrandingProcessByWeekNumber({
    weekNumber: yesterday.weekNumber,
    year: yesterday.year,
  });
  const {
    period_from,
    period_to,
    weekNumber,
    year,
    id: branding_process_id,
  } = brandingProcess;
  const { rows } = await getBrandingCardsInfo({
    period_from,
    period_to,
  });
  console.log({
    time: new Date(),
    message: 'moveDriverBrandingCards',
    moveDriverBrandingCards: rows.length,
  });
  const processedCards = [];

  for (const [index, row] of rows.entries()) {
    if (
      process.env.ENV === 'TEST' &&
      index === Number(process.env.BRANDING_CARDS_COUNT)
    ) {
      break;
    }
    const { driver_id, total_trips, auto_park_id } = row;

    const dbcard = await getCrmBrandingCardByDriverId({
      driver_id,
      branding_process_id,
    });
    if (!dbcard) {
      continue;
    }
    const stage_id = `DT1138_62:${computeBrandingCardFinishedStage({ total_trips, auto_park_id })}`;
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
        branding_process_id,
        driver_id,
        total_trips,
      });
    }
  }
  console.log(
    `${processedCards.length} branding cards updating has been finished.`
  );

  const resolveResp = await resolveBrandingProcessById(brandingProcess.id);
}
if (process.env.ENV === 'TEST') {
  console.log(
    `testing driver branding movement\ncards count :${process.env.BRANDING_CARDS_COUNT}`
  );
  await openSShTunnel;
  await moveDriverBrandingCards();
}
