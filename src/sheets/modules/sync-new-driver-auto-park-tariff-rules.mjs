import { isUuid } from '../../shared/shared.utils.mjs';
import {
  getAutoParksToSetTariffRules,
  getNewDriverTariffRulesByAutoParkSheetName,
} from '../sheets.utils.mjs';

export const synchronizeNewDriverAutoParkTariffRules = async () => {
  console.log({
    message: 'synchronizeNewDriverAutoParkTariffRules',
    date: new Date(),
  });
  const autoParks = await getAutoParksToSetTariffRules();
  const verifiedAutoParks = autoParks.filter((autoPark) =>
    isUuid(autoPark.auto_park_id)
  );
  console.log(verifiedAutoParks);

  for (const autoPark of verifiedAutoParks) {
    const { auto_park_id, auto_park_sheet_name } = autoPark;
    const tariffRules =
      await getNewDriverTariffRulesByAutoParkSheetName(auto_park_sheet_name);
    console.log(tariffRules);
  }
};

if (process.env.ENV == 'DEV') {
  synchronizeNewDriverAutoParkTariffRules();
}
