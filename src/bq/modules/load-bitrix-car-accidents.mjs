import {
  getCarSPAItems,
  getDTPDeals,
  getLinkedDeals,
} from '../../bitrix/bitrix.utils.mjs';

// 1. UTILITY FUNCTION (KEPT IN MODULE)
/**
 * Renames object properties based on a provided map.
 * @param {Object} data - The object with original keys (e.g., UF_CRM_...).
 * @param {Object} map - The map {originalKey: newKey}.
 * @returns {Object} The object with renamed keys.
 */
const renameFields = (data, map) => {
  const newData = {};
  for (const key in data) {
    // Use alias if found in the map, otherwise keep original key
    const newKey = map[key] || key;
    newData[newKey] = data[key];
  }
  return newData;
};

// 2. ALIASES/CONFIG (KEPT IN MODULE)
const FIELD_ALIASES = {
  // DTP Deal (Category 19) Custom Fields
  ID: 'id',
  CONTACT_NAME: 'Водій',
  STAGE_NAME: 'Стаадія', // Original typo retained
  OPPORTUNITY_ACCOUNT: 'Сума виставленого боргу водію по СРМ',
  CLOSEDATE: 'Дата завершення ремонту', // From crm_deal_uf
  UF_CRM_1635407076479: 'Винуватець ДТП',
  UF_CRM_1672920789484: 'Передати у роботу колектору',
  UF_CRM_1527615815: 'Місто',
  UF_CRM_1635248711959: 'Дата ДТП',
  UF_CRM_1635249720750: 'Держ номер авто (поле для CRM форми)', // Key for SPA Join
  UF_CRM_1635249881382: 'Як оформлено ДТП',
  UF_CRM_1621229719074: 'За якою статтею вилучили авто (штрафмайданчик)',
  UF_CRM_1659106666: 'Попередня вартість ремонту (по фото)',
  UF_CRM_1657614140: 'SID ремонту RemOnline',
  UF_CRM_1679065789167: 'Вартість ремонта по СІДу',
  UF_CRM_1654075851: 'Реальна вартість ремонту з врахуванням оплат за ремонт',
  UF_CRM_1642520789361: 'Погоджена сума ремонту',
  UF_CRM_1654075784: 'Додаткові витрати на ремонт (грн)',
  UF_CRM_1654075469: 'Зараховано від СК (грн)',
  UF_CRM_1654075693: 'Ремонт оплачено від 3-й сторони (грн)',
  UF_CRM_1654075624: 'Оплачено за ремонт водієм (стягнуто)',
  UF_CRM_1654076033: '3.79 - ДТП борг Водія (грн)',
  UF_CRM_1654076083: '3.82 - Штраф по ДТП (грн)',
};

// VZYS Deal (Category 42) Fields
const VZYS_ALIASES = {
  ASSIGNED_BY_NAME: 'Ким затрведжено',
  OPPORTUNITY: 'Сума відшкодування',
  UF_CRM_1658782991: 'Оцінка незалежного експерта',
  UF_CRM_1667980814193: 'Вдалося знайти власність??',
  UF_CRM_1667983478811: 'Номер судової справи',
  UF_CRM_1654602086875: 'system_dtp_deal_id', // Link ID for mapping
};

// PAYMEN Deal (Category 46) Fields
const PAYMEN_ALIASES = {
  ASSIGNED_BY_NAME: 'Відповідальний за страхову виплату',
  OPPORTUNITY: 'Дохід від страховки',
  UF_CRM_1635409690210: 'Дата подачі заяви про виплату СК',
  UF_CRM_1637135188721: 'Номер справи',
  UF_CRM_1642522388994:
    'Куди будуть зараховані кошти (або чи будуть вони зараховані)',
  UF_CRM_1654075469: 'Зараховано від СК (грн)__1',
  UF_CRM_1654602086875: 'system_dtp_deal_id_paymen', // Link ID for mapping
};

// Car SPA (Type 138) Fields
const CAR_ALIASES = {
  TITLE: 'Держ номер авто (поле для CRM форми)',
  UF_CRM_4_1654813441319: 'Власник авто',
  UF_CRM_4_1756727906: 'Статус лізингу',
  UF_CRM_4_1654801798307: 'Модель',
  UF_CRM_4_1654801509478: 'Рік випуску',
  UF_CRM_4_1654801485646: 'VIN-код',
  UF_CRM_4_1654801619341: 'ID Mapon',
  UF_CRM_4_1741607811: 'Брендування',
  UF_CRM_4_1743597840: 'Статус ліцензії',
  UF_CRM_4_1655367397930: 'Статус автомобіля в компанії',
  UF_CRM_4_1654802341211: 'Термін дії ОСАГО',
};

// 3. MAIN MODULE FUNCTION
/**
 * Executes a full analytical report by fetching data from multiple Bitrix24 entities,
 * performing local joins, and preserving original Ukrainian property names.
 * @returns {Promise<Array<Object>>} The joined report data.
 */
export async function generateUkrainianReport() {
  console.log(
    'Fetching all necessary datasets from Bitrix24 using dedicated API functions...'
  );

  // // FIX: Awaiting sequentially as requested.
  // // FIX: Relying on the imported utilities to handle the Bitrix client internally.
  // const dtpDeals = await getDTPDeals();

  // const linkedDeals = await getLinkedDeals();
  // const { vzys: vzysDeals, paymen: paymenDeals } = linkedDeals;

  const carItems = await getCarSPAItems();
  console.log(carItems);
  return;

  // FIX: Removed the unreachable 'return;' statement here, which was causing the function to exit early.

  console.log('Data fetched. Starting local joins and renaming...');

  // 4. Prepare Lookup Maps for Joining (Translates UFs on the fly)

  // Map VZYS Deals by the DTP Deal ID field value (UF_CRM_1654602086875)
  const vzysMap = vzysDeals.reduce((acc, deal) => {
    // FIX: Using the locally defined renameFields utility.
    const translated = renameFields(deal, VZYS_ALIASES);
    acc[deal.UF_CRM_1654602086875] = translated;
    return acc;
  }, {});

  // Map PAYMEN Deals by the DTP Deal ID field value (UF_CRM_1654602086875)
  const paymenMap = paymenDeals.reduce((acc, deal) => {
    const translated = renameFields(deal, PAYMEN_ALIASES);
    acc[deal.UF_CRM_1654602086875] = translated;
    return acc;
  }, {});

  // Map Car SPA Items by License Plate (TITLE)
  const carsMap = carItems.reduce((acc, item) => {
    const translated = renameFields(item, CAR_ALIASES);
    acc[item.TITLE] = translated;
    return acc;
  }, {});

  // 5. Perform the FINAL JOIN on the DTP Deals
  const finalReport = dtpDeals.map((dtpDeal) => {
    // Apply renames to the primary DTP deal
    const mainRecord = renameFields(dtpDeal, FIELD_ALIASES);

    // Get the linking IDs
    const dtpDealId = dtpDeal.ID;
    const licensePlate = dtpDeal.UF_CRM_1635249720750;

    // Merge Linked Data (LEFT JOIN equivalent)
    const vzysRecord = vzysMap[dtpDealId] || {};
    const paymenRecord = paymenMap[dtpDealId] || {};
    const carRecord = carsMap[licensePlate] || {};

    // Assemble the Final Row
    return {
      ...mainRecord,
      ...vzysRecord,
      ...paymenRecord,
      ...carRecord,
      // Manually re-add the OPPORTUNITY_ACCOUNT with its specific alias
      'Сума виставленого боргу водію по СРМ': dtpDeal.OPPORTUNITY_ACCOUNT,
    };
  });
  finalReport.forEach((rep) => {
    for (const key in FIELD_ALIASES) {
      if (!Object.hasOwn(rep, FIELD_ALIASES[key])) {
        rep[FIELD_ALIASES[key]] = null;
      }
    }
    for (const key in PAYMEN_ALIASES) {
      if (!Object.hasOwn(rep, PAYMEN_ALIASES[key])) {
        rep[PAYMEN_ALIASES[key]] = null;
      }
    }
    for (const key in CAR_ALIASES) {
      if (!Object.hasOwn(rep, CAR_ALIASES[key])) {
        rep[CAR_ALIASES[key]] = null;
      }
    }
  });
  console.log(
    `Report generated successfully. Total records: ${finalReport.length}`,
    finalReport
  );
  return finalReport;
}

// 6. TEST BLOCK (KEPT IN MODULE)
if (process.env.ENV === 'TEST') {
  // FIX: Wrapping the call in a .then/.catch to handle the Promise return of the async function.
  generateUkrainianReport()
    .then((report) =>
      console.log('Test run complete. Final report length:')
    )
    .catch((error) => console.error('Test run failed:', error));
}
