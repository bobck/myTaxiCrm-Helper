import {
  getFiredDebtorDriversCSInfo,
  getFiredDriversInfo,
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

async function prepareData() {
  const debtor_fired_drivers_map = new Map();
  const today = DateTime.local().startOf('day');
  const { weekNumber: cs_current_week, year: cs_current_year } = today;

  //all fired drivers
  const { rows: fired_drivers } = await getFiredDriversInfo();

  //fired drivers calculated statements for the last week
  const { rows: fired_drivers_cs } = await getFiredDebtorDriversCSInfo({
    fired_drivers_ids: fired_drivers.map((fd) => fd.driver_id),
  });

  //handled cash block rules only for debtors
  const { rows: hcbr } = await getHandledCashBlockRulesInfo({
    fired_drivers_ids: fired_drivers_cs.map((fd) => fd.driver_id),
  });

  for (const [index, fd_cs] of fired_drivers_cs.entries()) {
    if (index === Number(process.env.DEBTOR_DRIVERS_CARDS_COUNT)) {
      break;
    }
    const {
      driver_id,
      current_week_total_deposit,
      current_week_total_debt,
      current_week_balance,
    } = fd_cs;

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
    const matching_fired_driver = fired_drivers.find(
      (fd) => fd.driver_id === driver_id
    );
    const {
      is_balance_enabled,
      balance_activation_value,
      is_deposit_enabled,
      deposit_activation_value,
    } = matching_hcbr;
    const { full_name, auto_park_id, fire_date } = matching_fired_driver;

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
  const { debtor_fired_drivers_map } = await prepareData();
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
    let cityBrandingId;
    try {
      cityBrandingId = getCityBrandingId({ auto_park_id }).cityBrandingId;
    } catch (err) {
      console.log(
        `Error getting city branding id for ${cityBrandingId}\n auto_park_id=${auto_park_id}`
      );
    }
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
    Number(process.env.CHUNK_SIZE) || 5
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
    console.log(
      `chunk${index} successfully uploaded with ${chunk.length} elements`
    );
  }

  console.log(
    `${processedCards.length} branding cards creation has been finished.`
  );
}

if (process.env.ENV === 'TEST') {
  console.log(
    `testing fired debtor drivers creation\ncards count :${process.env.DEBTOR_DRIVERS_CARDS_COUNT}`
  );
  await openSShTunnel;
  await createFiredDebtorDriversCards();

  // await openSShTunnel;
  //
  // await prepareData();
}
