import { getEmployees } from '../../remonline/remonline.utils.mjs';

import { remonlineTokenToEnv } from '../../remonline/remonline.api.mjs';
import { createOrResetTableByName, loadRowsViaJSONFile } from '../bq-utils.mjs';
import { employeeTableSchema } from '../schemas.mjs';
export async function resetEmployeeTable() {
  await createOrResetTableByName({
    bqTableId: 'employees',
    schema: employeeTableSchema,
    dataSetId: 'RemOnline',
  });
}

export async function loadRemonlineEmployeesToBQ() {
  const { employees } = await getEmployees();
  const resp = await loadRowsViaJSONFile({
    dataset_id: 'RemOnline',
    table_id: 'employees',
    rows: employees,
    schema: employeeTableSchema,
  });
}

if (process.env.ENV === 'TEST') {
  await remonlineTokenToEnv(true);
  await loadRemonlineEmployeesToBQ();
  // await resetEmployeeTable();
}
