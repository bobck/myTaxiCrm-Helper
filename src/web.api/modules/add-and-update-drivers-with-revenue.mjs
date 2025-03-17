import { getCompanyDriversAutoparkRevenue } from '../web.api.utlites.mjs';
import {
  insertDriversWithRevenue,
  getExistedDriversWithRevenue,
  updateExistedDriversWithRevenue,
} from '../web.api.queries.mjs';

export async function addNewDriversAutoparkRevenue({
  autoParksIds,
  fromYear,
  fromWeek,
}) {
  const { rows } = await getCompanyDriversAutoparkRevenue({
    autoParksIds,
    fromYear,
    fromWeek,
  });

  const driverIds = rows.map((r) => r.driver_id);
  const { existedDriversWithRevenue } =
    await getExistedDriversWithRevenue(driverIds);

  const newDriversWithRevenue = rows.filter((driver) => {
    return (
      existedDriversWithRevenue.findIndex(
        (existed) => existed.driver_id == driver.driver_id
      ) == -1
    );
  });

  await insertDriversWithRevenue(newDriversWithRevenue);
}

export async function updateDriversWithRevenue({
  autoParksIds,
  fromYear,
  fromWeek,
}) {
  const { rows } = await getCompanyDriversAutoparkRevenue({
    autoParksIds,
    fromYear,
    fromWeek,
  });

  const driverIds = rows.map((r) => r.driver_id);
  const { existedDriversWithRevenue } =
    await getExistedDriversWithRevenue(driverIds);

  const updatedExistedDriversWithRevenue = rows.filter((driver) => {
    return (
      existedDriversWithRevenue.findIndex(
        (existed) =>
          existed.driver_id == driver.driver_id &&
          existed.auto_park_revenue != driver.auto_park_revenue
      ) != -1
    );
  });

  await updateExistedDriversWithRevenue(updatedExistedDriversWithRevenue);
}

if (process.env.ENV == 'TEST') {
  const ownCompanyIds = [
    '4ea03592-9278-4ede-adf8-f7345a856893',
    'b52d5c3c-9a8e-4898-8101-7c65f3ee70a4',
  ];
  await addNewDriversAutoparkRevenue({
    autoParksIds: ownCompanyIds,
    fromYear: 2020,
    fromWeek: 0,
  });

  const b2cCompanyIds = ['3b63b0cc-155b-43c5-a58a-979f6aac0d35'];
  await addNewDriversAutoparkRevenue({
    autoParksIds: b2cCompanyIds,
    fromYear: 2024,
    fromWeek: 10,
  });

  // updateDriversWithRevenue({ autoParksIds: ownCompanyIds, fromYear: 2020, fromWeek: 0 })
}
