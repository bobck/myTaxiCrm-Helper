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

const FIELD_ALIASES = {
  // Стандартні поля
  ID: 'id',
  CONTACT_NAME: 'driver_contact_name', // Водій
  STAGE_NAME: 'stage_name', // Стаадія (Виправлено до stage_name)
  OPPORTUNITY_ACCOUNT: 'debt_amount_crm', // Сума виставленого боргу водію по СРМ
  CLOSEDATE: 'repair_completion_date', // Дата завершення ремонту

  // Користувацькі поля (UF_CRM_...)
  UF_CRM_1635407076479: 'is_dtp_culprit', // Винуватець ДТП
  UF_CRM_1672920789484: 'transfer_to_collector', // Передати у роботу колектору
  UF_CRM_1527615815: 'city', // Місто
  UF_CRM_1635248711959: 'dtp_date', // Дата ДТП
  UF_CRM_1635249720750: 'vehicle_license_plate', // Держ номер авто (поле для CRM форми)
  UF_CRM_1635249881382: 'dtp_registration_type', // Як оформлено ДТП
  UF_CRM_1621229719074: 'car_seizure_article', // За якою статтею вилучили авто (штрафмайданчик)
  UF_CRM_1659106666: 'preliminary_repair_cost_photo', // Попередня вартість ремонту (по фото)
  UF_CRM_1657614140: 'remonline_repair_sid', // SID ремонту RemOnline
  UF_CRM_1679065789167: 'repair_cost_by_sid', // Вартість ремонта по СІДу
  UF_CRM_1654075851: 'actual_repair_cost_paid', // Реальна вартість ремонту з врахуванням оплат за ремонт
  UF_CRM_1642520789361: 'agreed_repair_amount', // Погоджена сума ремонту
  UF_CRM_1654075784: 'additional_repair_expenses_uah', // Додаткові витрати на ремонт (грн)
  UF_CRM_1654075469: 'credited_from_ins_co_uah', // Зараховано від СК (грн)
  UF_CRM_1654075693: 'repair_paid_by_3rd_party_uah', // Ремонт оплачено від 3-й сторони (грн)
  UF_CRM_1654075624: 'repair_paid_by_driver_collected', // Оплачено за ремонт водієм (стягнуто)
  UF_CRM_1654076033: 'dtp_driver_debt_uah', // 3.79 - ДТП борг Водія (грн)
  UF_CRM_1654076083: 'dtp_fine_uah', // 3.82 - Штраф по ДТП (грн)
};
const VZYS_ALIASES = {
  ASSIGNED_BY_NAME: 'approved_by', // Ким затрведжено
  OPPORTUNITY: 'reimbursement_amount', // Сума відшкодування
  UF_CRM_1658782991: 'independent_expert_evaluation', // Оцінка незалежного експерта
  UF_CRM_1667980814193: 'was_property_found', // Вдалося знайти власність??
  UF_CRM_1667983478811: 'court_case_number', // Номер судової справи
  UF_CRM_1654602086875: 'system_dtp_deal_id', // Link ID for mapping
};
const PAYMEN_ALIASES = {
  ASSIGNED_BY_NAME: 'responsible_for_ins_payment', // Відповідальний за страхову виплату
  OPPORTUNITY: 'insurance_revenue', // Дохід від страховки
  UF_CRM_1635409690210: 'ins_co_application_date', // Дата подачі заяви про виплату СК
  UF_CRM_1637135188721: 'ins_case_number', // Номер справи (Страхової)
  UF_CRM_1642522388994: 'funds_destination', // Куди будуть зараховані кошти
  UF_CRM_1654075469: 'credited_from_ins_co_uah_1', // Зараховано від СК (грн)__1
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
  const reportWithoutConatctsAndAssignedBy = dtpDeals.map((dtpDeal) => {
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

  return reportWithoutConatctsAndAssignedBy;
}

// 7. TEST BLOCK (KEPT IN MODULE)
if (process.env.ENV === 'TEST') {
  generateUkrainianReport()
    .then((report) =>
      console.log('Test run complete. Final report length:', report.length)
    )
    .catch((error) => console.error('Test run failed:', error));
}
