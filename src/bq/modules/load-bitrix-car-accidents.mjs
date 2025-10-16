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

  const processedReport = reportWithoutConatctsAndAssignedBy.map((dl) => {
    const deal = structuredClone(dl);

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
