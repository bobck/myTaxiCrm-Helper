import {
  assignDriversToCatalogTariff,
  getDriversCandidatsForCustomTerms,
} from '../web.api.utlites.mjs';

import {
  saveCreatedDriverCustomTariffId,
  markDriverCustomTariffAsDeleted,
  getUndeletedDriversCustomTariffIds,
  getCatalogTariffByWeekDayAndAutoParkId,
  getAllCatalogTariffs,
} from '../web.api.queries.mjs';
import { DateTime } from 'luxon';
import { devLog } from '../../shared/shared.utils.mjs';

export async function setDriversCustomTariff() {
  const catalogTariffs = await getAllCatalogTariffs();

  const autoParksIds = Array.from(
    new Set(catalogTariffs.map((catalogTariff) => catalogTariff.auto_park_id))
  );
  const allRuleIds = Array.from(
    new Set(catalogTariffs.map((catalogTariff) => catalogTariff.id))
  );

  const timeZone = 'Europe/Kiev';

  const kievDateTime = DateTime.now().setZone(timeZone);

  const isoDate = kievDateTime.toISODate();

  const { weekNumber, year } = kievDateTime;

  const companyId = process.env.WEB_API_TARGET_CONPANY_ID;

  const { driversCandidatsForCustomTerms } =
    await getDriversCandidatsForCustomTerms({
      isoDate,
      companyId,
      autoParksIds,
      weekNumber,
      year,
      allRuleIds,
    });
  devLog(driversCandidatsForCustomTerms);
  // return;
  const driversForCustomTerms = driversCandidatsForCustomTerms.filter(
    (driver) => {
      const { was_fired_days, custom_tariff_enabled, rent_event_id } = driver;
      return (
        (was_fired_days >= 14 || !was_fired_days) &&
        (!custom_tariff_enabled || custom_tariff_enabled == null) &&
        !rent_event_id
      );
    }
  );

  const attachDriverToTariffInputs = [];

  for (let driver of driversForCustomTerms) {
    const { auto_park_id, id: driver_id, start_working_at } = driver;

    const firstWorkingDayDate = new DateTime(start_working_at);

    const { id: catalogTariffId } =
      await getCatalogTariffByWeekDayAndAutoParkId({
        auto_park_id,
        weekDay: firstWorkingDayDate.weekday,
      });
    const vars = {
      autoParkId: auto_park_id,
      driverIds: [driver_id],
      catalogTariffId,
    };
    devLog({ vars });
    attachDriverToTariffInputs.push(vars);
  }

  for (let attachTariffToDriverInput of attachDriverToTariffInputs) {
    try {
      devLog({ attachTariffToDriverInput });
      // await assignDriversToCatalogTariff(attachTariffToDriverInput);
      await saveCreatedDriverCustomTariffId({
        tariffId: attachTariffToDriverInput.catalogTariffId,
        driverId: attachTariffToDriverInput.driverIds[0],
        autoParkId: attachTariffToDriverInput.autoParkId,
      });
    } catch (e) {
      console.error({
        module: 'setDriversCustomTariff',
        date: new Date(),
        attachTariffToDriverInput,
        message: e?.message,
      });
      continue;
    }
  }
  console.log({
    module: 'setDriversCustomTariff',
    newDrivers: attachDriverToTariffInputs.length,
    date: new Date(),
  });
}

export async function deleteDriversCustomTariff() {
  const { undeletedDriversCustomTariffIds } =
    await getUndeletedDriversCustomTariffIds();
  devLog(undeletedDriversCustomTariffIds);
  const attachTariffToDriverInputs = undeletedDriversCustomTariffIds.map(
    (val) => {
      return {
        catalogTariffId: undefined,
        driverIds: [val.driver_id],
        autoParkId: val.auto_park_id,
        tariffId: val.tariff_id,
        driverId: val.driver_id,
      };
    }
  );
  for (let attachTariffToDriverInput of attachTariffToDriverInputs) {
    try {
      devLog(attachTariffToDriverInput);
      const { driverId, tariffId } = attachTariffToDriverInput;
      await assignDriversToCatalogTariff(attachTariffToDriverInput);
      await markDriverCustomTariffAsDeleted({ tariffId, driverId });
    } catch (e) {
      console.error({
        date: new Date(),
        tariffId,
        message: e?.message,
        function: 'deleteDriversCustomTariff',
      });
      continue;
    }
  }
  console.log({
    module: 'deleteDriversCustomTariff',
    deattachedTariffs: undeletedDriversCustomTariffIds.length,
    date: new Date(),
  });
}

if (process.env.ENV == 'TEST') {
  setDriversCustomTariff();
  deleteDriversCustomTariff();
}
