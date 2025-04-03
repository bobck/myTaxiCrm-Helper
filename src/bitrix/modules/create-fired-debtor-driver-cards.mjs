import {
  getFiredDebtorDriversInfo,
  getHandledCashBlockRulesInfo,
} from '../../web.api/web.api.utlites.mjs';
import { cityListWithAssignedBy as cityList } from '../bitrix.constants.mjs';
import { openSShTunnel } from '../../../ssh.mjs';
import {
  getFiredDebtorDriverByWeekAndYear,
  insertFiredDebtorDriver,
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

  //all fired drivers
  const { rows: fired_drivers } = await getFiredDebtorDriversInfo();
  if (fired_drivers.length === 0) {
    return { debtor_fired_drivers_map: new Map() };
  }
  //handled cash block rules only for debtors
  const { rows: handledCashBlockRules } = await getHandledCashBlockRulesInfo({
    fired_drivers_ids: fired_drivers.map((fd) => fd.driver_id),
  });

  for (const [index, fired_driver] of fired_drivers.entries()) {
    if (index === Number(process.env.DEBTOR_DRIVERS_CARDS_COUNT)) {
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
  if (debtor_fired_drivers_map.size === 0) {
    console.error('No rows found for fired debtor drivers found.');
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

    const dbcard = await getFiredDebtorDriverByWeekAndYear({
      driver_id,
      cs_current_week,
      cs_current_year,
    });
    if (dbcard) {
      if (process.env.ENV === 'TEST') {
        console.log({
          message: 'present card',
          driver_id,
          cs_current_week,
          cs_current_year,
        });
      }
      continue;
    }

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
  console.log(
    `testing fired debtor drivers creation\ncards count :${process.env.DEBTOR_DRIVERS_CARDS_COUNT}`
  );
  await openSShTunnel;

  await createFiredDebtorDriversCards();
}
