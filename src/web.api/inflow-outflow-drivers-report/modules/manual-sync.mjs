import { DateTime } from 'luxon';

import { saveCarTransferAcceptanceCompany } from './save-car-transfer-acceptance-company.mjs';
import { saveCarTransferAcceptanceList } from './save-car-transfer-acceptance-list.mjs';
import { saveActiveDriversWithScheduleCompany } from './save-actives-with-schedule-company.mjs';
import { saveActiveDriversWithScheduleEvents } from './save-actives-with-schedule-events.mjs';

(async function manualSync() {
  //npm run iomanualsync -- --minus_days=1
  const minusDaysParam = process.argv.find((arg) =>
    arg.startsWith('--minus_days=')
  );
  const days = minusDaysParam ? minusDaysParam.split('=')[1] : null;

  console.log({ minusDays: days });
  if (!days) {
    return;
  }
  const dateTime = DateTime.now().setZone('Europe/Kyiv').minus({ days });
  const manualDate = dateTime.toFormat('yyyy-MM-dd');

  saveCarTransferAcceptanceList(manualDate);
  saveCarTransferAcceptanceCompany(manualDate);
  // await createOrResetTableByName({ bqTableId: 'car_transfer_acceptance_company', schema: carTransferAcceptanceCompanyTableSchema })
  saveActiveDriversWithScheduleCompany(manualDate);
  // await createOrResetTableByName({ bqTableId: 'actives_with_schedule_events', schema: activeDriversWithScheduleEventsTableSchema })
  saveActiveDriversWithScheduleEvents(manualDate);
})();
