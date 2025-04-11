import { getBrandingCardsInfo } from '../../web.api/web.api.utlites.mjs';
import {
  createBrandingProcess,
  insertBrandingCard,
  getBrandingProcessByWeekNumber,
  getBrandedLicencePlateNumbersByBrandingProcessId,
} from '../bitrix.queries.mjs';
import {
  chunkArray,
  createBitrixDriverBrandingCards,
  findContactByPhone,
} from '../bitrix.utils.mjs';
import { openSShTunnel } from '../../../ssh.mjs';
import {
  computeBrandingCardInProgressStage,
  computePeriodBounds,
} from '../bitrix.business-entity.mjs';
import { cityListWithAssignedBy as cityList } from '../bitrix.constants.mjs';
import { getBrandedLicencePlateNumbersFromBQ } from '../../bq/bq-utils.mjs';
import { carTransferAcceptanceCompanyTableSchema } from '../../bq/schemas.mjs';
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
  const { rows } = await getBrandingCardsInfo({
    brandedLicencePlateNumbers,
    period_from,
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
    const contact_id = await findContactByPhone({ phone });
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
      contact_id,
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
        auto_park_id: matchingCard.auto_park_id,
        license_plate: matchingCard.license_plate,
      });
    }
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
  // await getContactsTest({phone:'+380686776239'});
}
