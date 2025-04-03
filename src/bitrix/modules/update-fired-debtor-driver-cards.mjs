import {
  getDriverBalances,
  getHandledCashBlockRulesInfo,
} from '../../web.api/web.api.utlites.mjs';
import { openSShTunnel } from '../../../ssh.mjs';
import {
  getAllFiredDebtorDriver,
  getFiredDebtorDriverByWeekAndYear,
  updateFiredDebtorDriver,
} from '../bitrix.queries.mjs';
import {
  chunkArray,
  updateBitrixFiredDebtorDriversCards,
} from '../bitrix.utils.mjs';
import { DateTime } from 'luxon';

function computeStage({ apicard }) {
  return Number(apicard.current_week_balance) +
    Number(apicard.current_week_total_deposit) >
    0
    ? 'PREPARATION'
    : 'NEW';
}
function isUpdateFound({ dbcard, apicard }) {
  return !(
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

async function prepareFiredDebtorDriverCSWithHandledCashBlockRules() {
  const debtor_fired_drivers_map = new Map();
  const today = DateTime.local().startOf('day');
  const { weekNumber: cs_current_week, year: cs_current_year } = today;
  const firedDebtorDrivers = await getAllFiredDebtorDriver();

  if (firedDebtorDrivers.length === 0) {
    return { debtor_fired_drivers_map: new Map() };
  }

  const driver_ids = firedDebtorDrivers.map((driver) => driver.driver_id);
  //fired drivers calculated statements for the last week
  const { rows: actual_fired_drivers_cs } = await getDriverBalances({
    driver_ids,
  });

  //handled cash block rules only for debtors
  const { rows: hcbr } = await getHandledCashBlockRulesInfo({
    fired_drivers_ids: driver_ids,
  });
  for (const [index, fired_driver_cs] of actual_fired_drivers_cs.entries()) {
    if (index === Number(process.env.DEBTOR_DRIVERS_CARDS_COUNT)) {
      break;
    }
    const {
      driver_id,
      current_week_total_deposit,
      current_week_total_debt,
      current_week_balance,
    } = fired_driver_cs;
    let matching_hcbr = hcbr.find((hcbr) => hcbr.driver_id === driver_id);
    if (!matching_hcbr) {
      matching_hcbr = {
        driver_id,
        is_balance_enabled: null,
        balance_activation_value: null,
        is_deposit_enabled: null,
        deposit_activation_value: null,
      };
    }
    const {
      is_balance_enabled,
      balance_activation_value,
      is_deposit_enabled,
      deposit_activation_value,
    } = matching_hcbr;

    debtor_fired_drivers_map.set(driver_id, {
      current_week_total_deposit,
      current_week_total_debt,
      current_week_balance,
      cs_current_week,
      cs_current_year,
      is_balance_enabled,
      balance_activation_value,
      is_deposit_enabled,
      deposit_activation_value,
    });
  }
  return { debtor_fired_drivers_map };
}
export async function updateFiredDebtorDriversCards() {
  const { debtor_fired_drivers_map } =
    await prepareFiredDebtorDriverCSWithHandledCashBlockRules();

  if (debtor_fired_drivers_map.size === 0) {
    console.error('No rows found for fired debtor drivers found.');
    return;
  }

  const processedCards = [];
  for (const [driver_id, payload] of debtor_fired_drivers_map) {
    const {
      current_week_total_deposit,
      current_week_total_debt,
      current_week_balance,
      is_balance_enabled,
      balance_activation_value,
      is_deposit_enabled,
      deposit_activation_value,
      cs_current_week,
      cs_current_year,
    } = payload;
    const dbcard = await getFiredDebtorDriverByWeekAndYear({
      driver_id,
      cs_current_week,
      cs_current_year,
    });
    if (!dbcard) {
      continue;
    }
    if (!isUpdateFound({ dbcard, apicard: payload })) {
      if (process.env.ENV === 'TEST') {
        console.log(
          `row #${driver_id} hasn't been changed. There is no any sense to update it.`
        );
      }
      continue;
    }

    const stage_id = `DT1162_72:${computeStage({ apicard: payload })}`;
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
    Number(process.env.CHUNK_SIZE) || 8
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
    `${processedCards.length} fired debtor driver cards updating has been finished.`
  );
}

if (process.env.ENV === 'TEST') {
  console.log(
    `testing fired debtor drivers updating\ncards count: ${process.env.DEBTOR_DRIVERS_CARDS_COUNT}\nchunk size: ${process.env.CHUNK_SIZE}`
  );
  await openSShTunnel;
  await updateFiredDebtorDriversCards();
}
