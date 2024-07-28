import { getAndSaveLeadsByCreatedDate } from "./get-and-save-leads-by-created-date.mjs";
import { getAndSaveDealsByInterviewDate } from "./get-and-save-deals-by-interview-date.mjs";
import { getAndSaveDealsByClosedDate } from "./get-and-save-deals-by-closed-date.mjs";
import { DateTime } from "luxon";


(async function manualSync() {
    //npm run manualsync -- --minus_days=1
    const minusDaysParam = process.argv.find(arg => arg.startsWith('--minus_days='));
    const days = minusDaysParam ? minusDaysParam.split('=')[1] : null;

    console.log({ minusDays: days })
    if (!days) {
        return
    }

    const manualDate = DateTime.now().setZone('Europe/Kyiv').minus({ days }).toFormat('yyyy-MM-dd');

    getAndSaveLeadsByCreatedDate(manualDate)
    getAndSaveDealsByInterviewDate(manualDate)
    getAndSaveDealsByClosedDate(manualDate)

})();