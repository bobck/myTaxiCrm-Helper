import {
  checkFiredDebtorDriversInfo,
  getFiredDebtorDriversInfo,
} from '../../web.api/web.api.utlites.mjs';
import { cityListWithAssignedBy as cityList } from '../bitrix.constants.mjs';
import { openSShTunnel } from '../../../ssh.mjs';
import {
  getAllFiredDebtorDriver,
  getFiredDebtorDriverByWeekAndYear,
  insertFiredDebtorDriver,
  updateFiredDebtorDriver,
} from '../bitrix.queries.mjs';
import {
  chunkArray,
  createBitrixFiredDebtorDriversCards,
  updateBitrixFiredDebtorDriversCards,
} from '../bitrix.utils.mjs';
import { DateTime } from 'luxon';

function computeStage({ apicard }) {
  return apicard.current_week_balance + apicard.current_week_total_deposit > 0
    ? 'PREPARATION'
    : 'NEW';
}
function updateCheck({ dbcard, apicard }) {
  return (
    Number(dbcard.current_week_balance) ===
      Number(apicard.current_week_balance) &&
    Number(dbcard.current_week_total_deposit) ===
      Number(apicard.current_week_total_deposit) &&
    Number(dbcard.current_week_total_debt) ===
      Number(apicard.current_week_total_debt) &&
    Boolean(dbcard.is_balance_enabled) ===
      Boolean(apicard.is_balance_enabled) &&
    Number(dbcard.balance_activation_value) ===
      Number(apicard.balance_activation_value) &&
    Boolean(dbcard.is_deposit_enabled) ===
      Boolean(apicard.is_deposit_enabled) &&
    Number(dbcard.deposit_activation_value) ===
      Number(apicard.deposit_activation_value)
  );
}
function getCityBrandingId({ auto_park_id }) {
  const matchingCity = cityList.find(
    (obj) => obj.auto_park_id === auto_park_id
  );
  const { brandingId: cityBrandingId } = matchingCity;
  return { cityBrandingId };
}

export async function updateFiredDebtorDriversCards() {
  const firedDebtorDrivers = await getAllFiredDebtorDriver();
  const driver_ids = firedDebtorDrivers.map((driver) => driver.driver_id);

  const { rows } = await checkFiredDebtorDriversInfo({ driver_ids });
  if (rows.length === 0) {
    console.error('No rows found for fired debtor drivers found.');
    return;
  }

  const today = DateTime.local().startOf('day');
  const { weekNumber: cs_current_week, year: cs_current_year } = today;

  console.log(`rows.length: ${rows.length}`);

  const processedCards = [];
  for (const [index, row] of rows.entries()) {
    const {
      driver_id,
      current_week_total_deposit,
      current_week_total_debt,
      current_week_balance,
      is_balance_enabled,
      balance_activation_value,
      is_deposit_enabled,
      deposit_activation_value,
    } = row;
    const dbcard = await getFiredDebtorDriverByWeekAndYear({
      driver_id,
      cs_current_week,
      cs_current_year,
    });
    if (!dbcard) {
      console.log({
        message: 'Absent card',
        driver_id,
        cs_current_week,
        cs_current_year,
      });
      continue;
    }
    if (updateCheck({ dbcard, apicard: row })) {
      // console.log(
      //   `row #${index} hasn't been changed. There is no any sense to update it.`
      // );
      continue;
    }

    const stage_id = `DT1162_72:${computeStage({ apicard: row })}`;
    const card = {
      bitrix_card_id: dbcard.bitrix_card_id,
      stage_id,
      driver_id,
      cs_current_week,
      cs_current_year,
      current_week_balance,
      current_week_total_deposit,
      current_week_total_debt,
      is_balance_enabled,
      balance_activation_value,
      is_deposit_enabled,
      deposit_activation_value,
    };
    processedCards.push(card);
  }
  const chunkedProcessedCards = chunkArray(
    processedCards,
    Number(process.env.CHUNK_SIZE) || 5
  );
  for (const [index, chunk] of chunkedProcessedCards.entries()) {
    const bitrixRespObj = await updateBitrixFiredDebtorDriversCards({
      cards: chunk,
    });
    const handledResponseArr = [];
    for (const driver_id in bitrixRespObj) {
      const { id } = bitrixRespObj[driver_id]['item'];
      const matchingCard = chunk.find((c) => c.driver_id === driver_id);
      handledResponseArr.push({
        bitrix_card_id: id,
        ...matchingCard,
      });
    }
    for (const respElement of handledResponseArr) {
      await updateFiredDebtorDriver({
        ...respElement,
      });
    }
    // console.log(
    //   `chunk${index} successfully uploaded with ${chunk.length} elements`
    // );
  }

  console.log(
    `${processedCards.length} fired drivers cards updating has been finished.`
  );
}

if (process.env.ENV === 'TEST') {
  console.log(
    `testing fired debtor drivers updating\ncards count: ${process.env.DEBTOR_DRIVERS_CARDS_COUNT}\nchunk size: ${process.env.CHUNK_SIZE}`
  );
  await openSShTunnel;
  await updateFiredDebtorDriversCards();
}
