
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
  console.log(employees)
//   const handledAssets = employees.map((employee) => {
//     const item = { ...employee, owner_name: employee.owner?.name || employee.owner };
//     delete item.owner;
//     return item;
//   });
  const resp = await loadRowsViaJSONFile({
    dataset_id: 'RemOnline',
    table_id: 'employees',
    rows: employees,
    schema: employeeTableSchema,
  });
  console.log(resp);
}

if (process.env.ENV === 'TEST') {
  await remonlineTokenToEnv(true);
  await loadRemonlineEmployeesToBQ();
    // await resetEmployeeTable();
}
