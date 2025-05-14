import { getBoltDriversToBan } from '../../web.api/web.api.utlites.mjs';
import { cityListWithAssignedBy as cityList } from '../bitrix.constants.mjs';
import { chunkArray, updateRequestedDrivers } from '../bitrix.utils.mjs';
import { openSShTunnel } from '../../../ssh.mjs';
import { DateTime } from 'luxon';
import {
  // getBoltDriverBanReqByDriverId,
  // insertBoltDriverBanReq,
  // getALLBoltDriversToBan,
  getALLBoltDriversToBan,
} from '../bitrix.queries.mjs';

const Seven_days_without_trips_message_type = 3430;
const debtorState = 3434;
const notDebtorState = 3436;
function getCityBrandingId(auto_park_id) {
  return cityList.find((obj) => obj.auto_park_id === auto_park_id).brandingId;
}
function computeQueryParams() {
  const today = DateTime.local().startOf('day');
  const lowerBound = today.minus({ days: 8 });
  // Return the dates formatted as ISO strings (YYYY-MM-DD) for PostgreSQL
  return {
    period_from: lowerBound.toISODate(),
    weekNumber: today.weekNumber,
    year: today.year,
  };
}
function processDBCard({ driver_id, driversToBan }) {
  const dbcard = driversToBan.find((card) => card.driver_id === driver_id);

  if (
    dbcard === undefined ||
    dbcard === null
    // ||typeof dbcard === 'object'&& Object.keys(dbcard).length === 0
  ) {
    return { bitrix_deal_id: null };
  }
  const {
    bolt_id,
    bitrix_deal_id,
    phone,
    is_banned,
    is_first_letter_sent,
    is_second_letter_sent,
  } = dbcard;
  return { bitrix_deal_id };
}
export const moveBoltDriversToBan = async () => {
  const queryParams = computeQueryParams();
  const driversToBan = await getALLBoltDriversToBan(queryParams);
  const driver_ids = driversToBan.map((driver) => driver.driver_id);

  const { rows } = await getBoltDriversToBan({ ...queryParams, driver_ids });
  if (rows.length === 0) {
    console.error('No any drivers to ban found.');
    return;
  }

  const processedCards = [];
  for (const [index, row] of rows.entries()) {
    if (
      process.env.ENV === 'TEST' &&
      index === Number(process.env.BOLT_DRIVERS_BAN_CARDS)
    ) {
      console.log('testing has been ended');
      break;
    }
    const { driver_id, driver_balance } = row;

    const debt = String(-1 * driver_balance);
    // const isDebtorState = debt>0 ? debtorState : notDebtorState;
    const { bitrix_deal_id } = processDBCard({ driver_id, driversToBan });
    if (bitrix_deal_id === null) {
      continue;
    }
    const card = {
      bitrix_deal_id,
      driver_id,
      debt,
      // isDebtorState,
      isDebtorState: debtorState,
      messageType: Seven_days_without_trips_message_type,
    };
    processedCards.push(card);
  }
  const chunkedProcessedCards = chunkArray(
    processedCards,
    Number(process.env.CHUNK_SIZE) || 10
  );
  for (const [index, chunk] of chunkedProcessedCards.entries()) {
    const bitrixRespObj = await updateRequestedDrivers({
      cards: chunk,
    });
    console.log( bitrixRespObj );
    return;
    const handledResponseArr = [];
    for (const driver_id in bitrixRespObj) {
      const { id } = bitrixRespObj[driver_id]['item'];
      const matchingCard = chunk.find((c) => c.driver_id === driver_id);
      //{ bitrix_card_id, debt, driver_id }
      handledResponseArr.push({
        bitrix_card_id: id,
        driver_id: matchingCard.driver_id,
        debt: matchingCard.debt,
      });
    }
    for (const respElement of handledResponseArr) {
      const { bitrix_card_id, debt, driver_id } = respElement;
      await insertBoltDriverBanReq({
        driver_id,
        bitrix_card_id,
        debt,
      });
    }
    //  console.log(`chunk ${index} with ${chunk.length} has been successfully uploaded`)
  }

  console.log(
    `${processedCards.length} bolt drivers to ban cards creation has been finished.`
  );
};

if (process.env.ENV === 'TEST') {
  console.log(
    `testing bolt drivers ban cards creation\ncards count :${process.env.BOLT_DRIVERS_BAN_CARDS}\nchunk size:${process.env.CHUNK_SIZE}`
  );
  await openSShTunnel;

  await moveBoltDriversToBan();
}
