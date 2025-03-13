import {
  getFreshFiredDrivers,
  createDeal,
  findContactByPhone,
} from '../bitrix.utils.mjs';

import { cityListWithAssignedBy } from '../bitrix.constants.mjs';

import {
  getLastUnixCreatedAt,
  saveLastUnixCreatedAt,
} from '../bitrix.queries.mjs';

export async function createDealsWithFiredDrivers() {
  const lastCreated = await getLastUnixCreatedAt({
    categoryId: process.env.FIRED_CATEGORY_ID,
  });

  if (!lastCreated) {
    return;
  }

  const { unix_created_at: lastUnixCreatedAt } = lastCreated;

  const { rows: drivers } = await getFreshFiredDrivers({
    unixCreatedAt: lastUnixCreatedAt,
  });

  if (drivers.length == 0) {
    return;
  }

  const driversWithAssignedBy = drivers.map((driver) => {
    const matchingCity = cityListWithAssignedBy.find(
      (city) => city.auto_park_id === driver.auto_park_id
    );
    if (matchingCity) {
      return {
        ...driver,
        assignedBy: matchingCity.assignedBy,
        cityId: matchingCity.cityId,
        cityName: matchingCity.cityName,
      };
    } else {
      return driver;
    }
  });

  for (let driverToImport of driversWithAssignedBy) {
    const {
      full_name: name,
      phone,
      status,
      comment,
      rides_count: ridesCount,
      worked_days: workedDays,
      assignedBy,
      cityId,
      cityName,
      unix_created_at: unixCreatedAt,
      rides_count_current_week = 0,
      rides_count_prev_week = 0,
      rides_count_two_weeks_ago = 0,
      rides_count_three_weeks_ago = 0,
    } = driverToImport;

    const contactId = await findContactByPhone({
      phone,
    });

    const firedReason = `${status} - ${comment}`;
    const title = `${name} - ${cityName} - ${ridesCount}`;
    const ridesCountWithPastWeeks = `${rides_count_three_weeks_ago}-${rides_count_two_weeks_ago}-${rides_count_prev_week}-${rides_count_current_week} (${ridesCount})`;

    await createDeal({
      cityId,
      assignedBy,
      title,
      name,
      phone,
      firedReason,
      ridesCount: ridesCountWithPastWeeks,
      workedDays,
      contactId,
    });

    await saveLastUnixCreatedAt({
      unixCreatedAt,
      categoryId: process.env.FIRED_CATEGORY_ID,
    });
  }
}
