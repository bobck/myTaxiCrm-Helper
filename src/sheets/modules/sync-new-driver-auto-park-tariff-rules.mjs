import { isUuid } from '../../shared/shared.utils.mjs';
import {
    getAutoParksToSetTariffRules,
    getNewDriverTariffRulesByAutoParkSheetName,
} from '../sheets.utils.mjs';

export const synchronizeNewDriverAutoParkTariffRules = async () => {

    const existingRules = []


    const autoParks = await getAutoParksToSetTariffRules();
    const verifiedAutoParks = autoParks.filter((autoPark) =>
        isUuid(autoPark.auto_park_id)
    );
    console.log(verifiedAutoParks);
    const autoParkWithTariffRules = new Map();
    for (const autoPark of verifiedAutoParks) {
        const { auto_park_id, auto_park_sheet_name } = autoPark;
        const tariffRules = await getNewDriverTariffRulesByAutoParkSheetName(auto_park_sheet_name);
        autoParkWithTariffRules.set(auto_park_id, tariffRules)
        
    }
    console.log(autoParkWithTariffRules);


    console.log('comparing...');


    console.log('new rules: 1,2,3,...');
    console.log('deleted rules: 4,5,6...');








    console.log({
        message: 'synchronizeNewDriverAutoParkTariffRules',
        date: new Date(),
    });

};

if (process.env.ENV == 'DEV') {
    synchronizeNewDriverAutoParkTariffRules();
}
