import {
  getFiredDebtorDriversInfo,
  getHandledCashBlockRulesInfo,
} from '../../web.api/web.api.utlites.mjs';
import { cityListWithAssignedBy as cityList } from '../bitrix.constants.mjs';
import {
  insertFiredDebtorDriver,
  getAllFiredDebtorDriver,
} from '../bitrix.queries.mjs';
import {
  chunkArray,
  createBitrixFiredDebtorDriversCards,
} from '../bitrix.utils.mjs';
import { DateTime } from 'luxon';

function getCityBrandingId({ auto_park_id }) {
  const matchingCity = cityList.find(
    (obj) => obj.auto_park_id === auto_park_id
  );
  const { brandingId: cityBrandingId } = matchingCity;
  return { cityBrandingId };
}

async function prepareFiredDebtorDriverCSWithHandledCashBlockRules() {
  const debtor_fired_drivers_map = new Map();
  const today = DateTime.local().startOf('day');
  const { weekNumber: cs_current_week, year: cs_current_year } = today;
  const firedDebtorDrivers = await getAllFiredDebtorDriver();

  // array of fired debtor drivers with existing bitrix cards
  const fired_debtor_drivers_with_existing_bitrix_cards =
    firedDebtorDrivers.map((driver) => driver.driver_id);

  const { rows: fired_drivers } = await getFiredDebtorDriversInfo({
    fired_debtor_drivers_with_existing_bitrix_cards,
  });

  if (fired_drivers.length === 0) {
    return { debtor_fired_drivers_map: new Map() };
  }
  //handled cash block rules only for debtors
  const { rows: handledCashBlockRules } = await getHandledCashBlockRulesInfo({
    fired_drivers_ids: fired_drivers.map((fd) => fd.driver_id),
  });

  for (const [index, fired_driver] of fired_drivers.entries()) {
    if (
      process.env.ENV === 'TEST' &&
      index === Number(process.env.DEBTOR_DRIVERS_CARDS_COUNT)
    ) {
      break;
    }
    const {
      full_name,
      auto_park_id,
      fire_date,
      driver_id,
      current_week_total_deposit,
      current_week_total_debt,
      current_week_balance,
    } = fired_driver;

    let matching_hcbr = handledCashBlockRules.find(
      (hcbr) => hcbr.driver_id === driver_id
    );
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
      full_name,
      auto_park_id,
      fire_date,
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

export async function createFiredDebtorDriversCards() {
  const { debtor_fired_drivers_map } =
    await prepareFiredDebtorDriverCSWithHandledCashBlockRules();
  console.log({
    time: new Date(),
    message: 'createFiredDebtorDriversCards',
    debtor_fired_drivers_map: debtor_fired_drivers_map.size,
  });
  if (debtor_fired_drivers_map.size === 0) {
    return;
  }
  const processedCards = [];
  for (const [driver_id, payload] of debtor_fired_drivers_map) {
    const {
      full_name,
      auto_park_id,
      current_week_total_deposit,
      current_week_total_debt,
      current_week_balance,
      fire_date,
      is_balance_enabled,
      balance_activation_value,
      is_deposit_enabled,
      deposit_activation_value,
      cs_current_week,
      cs_current_year,
    } = payload;

    const stage_id = `DT1162_72:NEW`;
    const cityBrandingId = getCityBrandingId({ auto_park_id }).cityBrandingId;
    const card = {
      stage_id,
      driver_id,
      full_name,
      auto_park_id,
      cityBrandingId,
      cs_current_week,
      cs_current_year,
      current_week_balance,
      current_week_total_deposit,
      current_week_total_debt,
      fire_date,
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
    const bitrixRespObj = await createBitrixFiredDebtorDriversCards({
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
      await insertFiredDebtorDriver({
        ...respElement,
      });
    }
    // console.log(
    //   `chunk${index} successfully uploaded with ${chunk.length} elements`
    // );
  }

  console.log(
    `${processedCards.length} fired debtor driver cards creation has been finished.`
  );
}

if (process.env.ENV === 'TEST') {
  console.log({
    message: 'testing fired debtor drivers creation',
    cards_count: process.env.DEBTOR_DRIVERS_CARDS_COUNT,
    chunk_size: process.env.CHUNK_SIZE,
  });


  await createFiredDebtorDriversCards();

  // const { debtor_fired_drivers_map: preparedData } =
  //   await prepareFiredDebtorDriverCSWithHandledCashBlockRules();
  // console.log(preparedData, preparedData.size);
}
