import { getBrandingCarsInfo } from '../../web.api/web.api.utlites.mjs';
import {
  createBrandingProcess,
  insertBrandingCard,
  getBrandingProcessByWeekNumber,
  getBrandedLicencePlateNumbersByBrandingProcessId,
} from '../bitrix.queries.mjs';
import {
  chunkArray,
  createBitrixDriverBrandingCards,
  findContactsByPhonesObjectReturned,
} from '../bitrix.utils.mjs';
import { openSShTunnel } from '../../../ssh.mjs';
import {
  computeBrandingCardInProgressStage,
  computePeriodBounds,
} from '../bitrix.business-entity.mjs';
import { cityListWithAssignedBy as cityList } from '../bitrix.constants.mjs';
import { getBrandedLicencePlateNumbersFromBQ } from '../../bq/bq-utils.mjs';
function getCityBrandingId({ auto_park_id }) {
  const matchingCity = cityList.find(
    (obj) => obj.auto_park_id === auto_park_id
  );
  const { brandingId: cityBrandingId } = matchingCity;
  return { cityBrandingId };
}

async function getBrandingProcess() {
  const { weekNumber, year, period_from, period_to } = computePeriodBounds();
  const brandingProcess = await getBrandingProcessByWeekNumber({
    weekNumber,
    year,
  });
  if (brandingProcess) {
    return { brandingProcess };
  }
  const newbrandingProcess = await createBrandingProcess({
    year,
    weekNumber,
    period_from,
    period_to,
  });
  return { brandingProcess: newbrandingProcess };
}

export async function createDriverBrandingCards() {
  const { brandingProcess } = await getBrandingProcess();

  const {
    period_from,
    period_to,
    id: branding_process_id,
    weekNumber,
    year,
  } = brandingProcess;
  const { brandedLicencePlateNumbers: existingBrandedLicencePlateNumbers } =
    await getBrandedLicencePlateNumbersByBrandingProcessId({
      branding_process_id,
    });
  const { brandedLicencePlateNumbers } =
    await getBrandedLicencePlateNumbersFromBQ({
      existingBrandedLicencePlateNumbers,
    });
  if (brandedLicencePlateNumbers.length === 0) {
    return;
  }
  const { rows } = await getBrandingCarsInfo({
    brandedLicencePlateNumbers,
    period_from,
  });
  console.log({
    time: new Date(),
    message: 'createDriverBrandingCards',
    createDriverBrandingCards: rows.length,
  });
  if (rows.length === 0) {
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
      driver_name,
      phone,
      auto_park_id,
      total_trips,
      license_plate,
    } = row;

    const { cityBrandingId } = getCityBrandingId({ auto_park_id });
    const stage_id = `DT1138_62:${computeBrandingCardInProgressStage({ total_trips, auto_park_id })}`;
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
      auto_park_id,
      license_plate,
    };
    processedCards.push(card);
  }
  const chunkedProcessedCards = chunkArray(
    processedCards,
    Number(process.env.CHUNK_SIZE) || 7
  );

  //chunk extension with contact_ids
  for (const [index, chunk] of chunkedProcessedCards.entries()) {
    const contact_ids = await findContactsByPhonesObjectReturned({
      drivers: chunk,
    });
    for (const card of chunk) {
      const { driver_id } = card;
      const contact_id = contact_ids[driver_id];
      if (contact_id instanceof Array) {
        card.contact_id = null;
        continue;
      }
      card.contact_id = contact_id.CONTACT[0];
    }
  }
  //bitrix card creation
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
        auto_park_id: matchingCard.auto_park_id,
        license_plate: matchingCard.license_plate,
      });
    }
    //sqlite insertion
    for (const respElement of handledResponseArr) {
      const {
        driver_id,
        total_trips,
        bitrix_card_id,
        auto_park_id,
        license_plate,
      } = respElement;
      await insertBrandingCard({
        driver_id,
        total_trips,
        bitrix_card_id,
        branding_process_id,
        auto_park_id,
        license_plate,
      });
    }
  }
  // console.log(processedCards);
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

  // const filter = cityList.filter((city) => {
  //   return !Object.hasOwn(city, 'brandingId');
  // });
  // console.log({ filter });
}
