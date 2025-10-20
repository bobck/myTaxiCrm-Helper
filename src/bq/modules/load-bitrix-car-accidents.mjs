import {
  BRANDING_MAP,
  CAR_ALIASES,
  CAR_OWNER_MAP,
  CAR_SEIZURE_MAP,
  cityListWithAssignedBy,
  DTP_BLAME_MAP,
  DTP_REGISTRATION_MAP,
  DTP_STAGES_MAP,
  FIELD_ALIASES,
  LEASING_STATUS_MAP,
  LICENSE_STATUS_MAP,
  MODEL_MAP,
  PAYMEN_ALIASES,
  VEHICLE_STATUS_IN_COMPANY_MAP,
  VZYS_ALIASES,
} from '../../bitrix/bitrix.constants.mjs';
import {
  getBitrixUserById,
  getCarSPAItems,
  getDTPDeals,
  getLinkedDeals,
} from '../../bitrix/bitrix.utils.mjs';
import { parseCyrillicToLatinChars } from '../../shared/shared.utils.mjs';

const renameFields = (data, map) => {
  const newData = {};
  for (const key in data) {
    const newKey = map[key] || key;
    newData[newKey] = data[key];
  }
  return newData;
};

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

  const paymenMap = paymenDeals.reduce((acc, deal) => {
    const translated = renameFields(deal, PAYMEN_ALIASES);
    acc[deal.UF_CRM_1654602086875] = translated;
    return acc;
  }, {});
  const carsMap = carItems.reduce((acc, item) => {
    const translated = renameFields(item, CAR_ALIASES);
    const licensePlate = parseCyrillicToLatinChars(item.title);
    acc[licensePlate] = translated;

    return acc;
  }, {});

  const reportWithoutConatctsAndAssignedBy = dtpDeals.map((dtpDeal) => {
    const mainRecord = renameFields(dtpDeal, FIELD_ALIASES);

    const dtpDealId = dtpDeal.ID;
    const licensePlate = parseCyrillicToLatinChars(
      dtpDeal.UF_CRM_1635249720750
    );

    const vzysRecord = vzysMap[dtpDealId] || {};
    const paymenRecord = paymenMap[dtpDealId] || {};
    const carRecord = carsMap[licensePlate] || {};

    const assembledRecord = {
      ...mainRecord,
      ...vzysRecord,
      ...paymenRecord,
      ...carRecord,
    };
    console.log(assembledRecord);

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
  const processedReport = reportWithoutConatctsAndAssignedBy.map((dl) => {
    const deal = structuredClone(dl);
    const {
      dtp_registration_type,
      approved_by,
      responsible_for_ins_payment,
      is_dtp_culprit,
      transfer_to_collector,
      vehicle_model,
      vehicle_owner,
      vehicle_status_in_company,
      branding,
      license_status,
      leasing_status,
      city,
    } = deal;

    deal.dtp_registration_type = DTP_REGISTRATION_MAP[dtp_registration_type];
    deal.blame = DTP_BLAME_MAP[is_dtp_culprit];
    deal.transfer_to_collector = Boolean(Number(transfer_to_collector));
    deal.vehicle_model = MODEL_MAP[vehicle_model];
    deal.vehicle_owner = CAR_OWNER_MAP[vehicle_owner];
    deal.vehicle_status_in_company =
      VEHICLE_STATUS_IN_COMPANY_MAP[vehicle_status_in_company];
    deal.branding = BRANDING_MAP[branding];
    deal.license_status = LICENSE_STATUS_MAP[license_status];
    deal.leasing_status = LEASING_STATUS_MAP[leasing_status];
    deal.stage = DTP_STAGES_MAP[deal.STAGE_ID];

    delete deal.STAGE_ID;
    delete deal.is_dtp_culprit;
    delete deal.title;
    delete deal['UF_CRM_1654602086875'];
    delete deal.ID;

    /**
     * debt_amount_crm
     * car_seizure_article
     * vehicle_status_in_company
     * license_status
     * assigned_by_name (paymen)
     */
    const cityData = cityListWithAssignedBy.find((ct) => ct.cityId == city);
    
    if (!cityData) {
      return deal;
    }
    if (cityData.cityName == 'unknown') {
      return deal;
    }

    const { auto_park_id, cityName } = cityData;
    deal.city = cityName;
    deal.auto_park_id = auto_park_id;

    return deal;
  });
  return processedReport;
}

// 7. TEST BLOCK (KEPT IN MODULE)
if (process.env.ENV === 'TEST') {
  generateUkrainianReport()
    .then((report) =>
      console.log(
        report.slice(report.length - 100),
        'Test run complete. Final report length:',
        report.length
      )
    )
    .catch((error) => console.error('Test run failed:', error));
}
