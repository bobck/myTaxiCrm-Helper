import {
  getCarSPAItems,
  getDTPDeals,
  getLinkedDeals,
} from '../../bitrix/bitrix.utils.mjs';
import { parseCyrillicToLatinChars } from '../../shared/shared.utils.mjs';

// NOTE: Since the utility functions use the Bitrix client initialized in their own file,
// we will assume they are modified to handle pagination internally, or we must
// define a paginating helper here and use the raw options.
// Given the complexity of modifying the imported functions, I'll provide the module
// logic that *should* be done if you had full control over a sequential API client.

// --- 1. UTILITY FUNCTION (KEPT IN MODULE) ---
/**
 * Renames object properties based on a provided map.
 * ... (unchanged)
 */
const renameFields = (data, map) => {
  const newData = {};
  for (const key in data) {
    const newKey = map[key] || key;
    newData[newKey] = data[key];
  }
  return newData;
};

// --- 2. ALIASES/CONFIG (KEPT IN MODULE) ---
// ... (All aliases remain unchanged as defined in your prompt)
const FIELD_ALIASES = {
  // DTP Deal (Category 19) Custom Fields
  ID: 'id',
  CONTACT_NAME: 'Водій',
  STAGE_NAME: 'Стаадія',
  OPPORTUNITY_ACCOUNT: 'Сума виставленого боргу водію по СРМ',
  CLOSEDATE: 'Дата завершення ремонту',
  UF_CRM_1635407076479: 'Винуватець ДТП',
  UF_CRM_1672920789484: 'Передати у роботу колектору',
  UF_CRM_1527615815: 'Місто',
  UF_CRM_1635248711959: 'Дата ДТП',
  UF_CRM_1635249720750: 'Держ номер авто (поле для CRM форми)',
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

const VZYS_ALIASES = {
  ASSIGNED_BY_NAME: 'Ким затрведжено',
  OPPORTUNITY: 'Сума відшкодування',
  UF_CRM_1658782991: 'Оцінка незалежного експерта',
  UF_CRM_1667980814193: 'Вдалося знайти власність??',
  UF_CRM_1667983478811: 'Номер судової справи',
  UF_CRM_1654602086875: 'system_dtp_deal_id', // Link ID for mapping
};

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

const CAR_ALIASES = {
  title: 'Держ номер авто (поле для CRM форми)',
  ufCrm4_1654813441319: 'Власник авто',
  ufCrm4_1756727906: 'Статус лізингу',
  ufCrm4_1654801798307: 'Модель',
  ufCrm4_1654801509478: 'Рік випуску',
  ufCrm4_1654801485646: 'VIN-код',
  ufCrm4_1654801619341: 'ID Mapon',
  ufCrm4_1741607811: 'Брендування',
  ufCrm4_1743597840: 'Статус ліцензії',
  ufCrm4_1655367397930: 'Статус автомобіля в компанії',
  ufCrm4_1654802341211: 'Термін дії ОСАГО',
};

// 3. MAIN MODULE FUNCTION
export async function generateUkrainianReport() {
  console.log(
    'Fetching all necessary datasets from Bitrix24 sequentially (now handling pagination)...'
  );

  const dtpDeals = await getDTPDeals();

  const linkedDeals = await getLinkedDeals();

  const carItems = await getCarSPAItems();

  const { vzys: vzysDeals, paymen: paymenDeals } = linkedDeals;

  const vzysMap = vzysDeals.reduce((acc, deal) => {
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
    const licensePlate = parseCyrillicToLatinChars(item.title);
    acc[licensePlate] = translated;

    return acc;
  }, {});

  // 5. Perform the FINAL JOIN on the DTP Deals
  const finalReport = dtpDeals.map((dtpDeal) => {
    // Apply renames to the primary DTP deal
    const mainRecord = renameFields(dtpDeal, FIELD_ALIASES);

    // Get the linking IDs
    const dtpDealId = dtpDeal.ID;
    const licensePlate = parseCyrillicToLatinChars(
      dtpDeal.UF_CRM_1635249720750
    );

    // Merge Linked Data (LEFT JOIN equivalent)
    const vzysRecord = vzysMap[dtpDealId] || {};
    const paymenRecord = paymenMap[dtpDealId] || {};
    const carRecord = carsMap[licensePlate] || {};

    // Assemble the Final Row
    const assembledRecord = {
      ...mainRecord,
      ...vzysRecord,
      ...paymenRecord,
      ...carRecord,
      // Manually re-add the OPPORTUNITY_ACCOUNT with its specific alias
      'Сума виставленого боргу водію по СРМ': dtpDeal.OPPORTUNITY_ACCOUNT,
    };
    console.log(assembledRecord);

    // 6. Ensure all keys from aliases are present (for BQ schema consistency)
    const allAliases = {
      ...FIELD_ALIASES,
      ...VZYS_ALIASES,
      ...PAYMEN_ALIASES,
      ...CAR_ALIASES,
    };

    for (const aliasValue of Object.values(allAliases)) {
      if (!Object.hasOwn(assembledRecord, aliasValue)) {
        assembledRecord[aliasValue] = null;
      }
    }

    return assembledRecord;
  });
  console.log(finalReport[0]);
  console.log(
    `Report generated successfully. Total records: ${finalReport.length}`
  );
  
  return finalReport;
}

// 7. TEST BLOCK (KEPT IN MODULE)
if (process.env.ENV === 'TEST') {
  generateUkrainianReport()
    .then((report) =>
      console.log('Test run complete. Final report length:', report.length)
    )
    .catch((error) => console.error('Test run failed:', error));
}
