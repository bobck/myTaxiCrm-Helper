import {
  CAR_ALIASES,
  FIELD_ALIASES,
  PAYMEN_ALIASES,
  VZYS_ALIASES,
} from '../../bitrix/bitrix.constants.mjs';
import {
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
      is_dtp_culprit,
      transfer_to_collector,
      vehicle_model,
      vehicle_owner,
      vehicle_status_in_company,
      branding,
      license_status,
      leasing_status,
      city
    } = deal;
    delete deal['UF_CRM_1654602086875'];
  });
  return processedReport;
}

// 7. TEST BLOCK (KEPT IN MODULE)
if (process.env.ENV === 'TEST') {
  generateUkrainianReport()
    .then((report) =>
      console.log('Test run complete. Final report length:', report.length)
    )
    .catch((error) => console.error('Test run failed:', error));
}
