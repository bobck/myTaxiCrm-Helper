import { DateTime } from 'luxon';
import { openSShTunnel } from '../../../ssh.mjs';
import {
  getDriversIgnoringCashBlockRules,
  getDriversWithActiveCashBlockRules,
  insertDriverWithCashBlockRules,
  markDriverCashBlockRulesAsDeleted,
} from '../web.api.queries.mjs';
import {
  getAllWorkingDriverIds,
  makeCRMRequestlimited,
  getDriversWhoPaidOff,
  getTheMostRecentDriverCashBlockRuleIdByDriverId,
} from '../web.api.utlites.mjs';
import { readDCBRSheetColumnA } from '../../sheets/sheets-utils.mjs';

const activationValue = 200;
const maxDebt = -1000;

const calculateDriverCashBlockRules = () => {
  const cashBlockRule = {
    activationValue,
    isEnabled: true,
    target: 'BALANCE',
  };
  const cashBlockRules = [];
  if (cashBlockRule.isEnabled) cashBlockRules.push(cashBlockRule);
  return { cashBlockRules };
};
const editDriverCashBlockRulesMutation = async ({ variables }) => {
  try {
    const query =
      'mutation EditDriverCashBlockRules($editDriverCashBlockRulesInput: EditDriverCashBlockRulesInput!) {\n  editDriverCashBlockRules(editDriverCashBlockRulesInput: $editDriverCashBlockRulesInput) {\n    success\n  }\n}';
    const bodyForEditRules = {
      operationName: 'EditDriverCashBlockRules',
      variables,
      query,
    };
    const { data, errors } = await makeCRMRequestlimited({
      body: bodyForEditRules,
    });
    const { editDriverCashBlockRules } = data;
    const { success } = editDriverCashBlockRules;
    return { success, errors };
  } catch (errors) {
    const [error] = errors;
    const { message, locations, path, extensions } = error;

    throw { message, locations, path, extensions, variables };
  }
};
const deleteDriverCustomCashBlockRuleMutation = async ({
  driver_id: driverId,
  driver_cash_block_rule_id: ruleId,
}) => {
  const operationName = 'DeleteDriverCustomCashboxRules';
  const query =
    'mutation DeleteDriverCustomCashboxRules($deleteDriverCustomCashboxRulesInput: DeleteDriverCustomCashboxRulesInput!) {\n  deleteDriverCustomCashboxRules(deleteDriverCustomCashboxRulesInput: $deleteDriverCustomCashboxRulesInput) {\n    success\n  }\n}';
  const variables = {
    deleteDriverCustomCashboxRulesInput: { driverId, ruleId },
  };
  const { data, errors } = await makeCRMRequestlimited({
    body: { operationName, query, variables },
  });
  const { deleteDriverCustomCashboxRules } = data;
  const { success } = deleteDriverCustomCashboxRules;
  return { success, errors };
};
const calculateMutationVariables = ({
  auto_park_id,
  driver_id,
  cashBlockRules,
}) => {
  const variables = {
    editDriverCashBlockRulesInput: {
      autoParkId: auto_park_id,
      driverId: driver_id,
      isEnabled: cashBlockRules.length > 0,
      mode: 'MIN_DEBT', // MAX_DEBT | MIN_DEBT
      rules: cashBlockRules,
    },
  };
  return { variables };
};
const calculateCurrentWeekAndYear = () => {
  const today = DateTime.local().startOf('day');
  const { year, weekNumber } = today;
  return { year, weekNumber };
};
export const setDriverCashBlockRules = async () => {
  const { year, weekNumber } = calculateCurrentWeekAndYear();
  const IdsOfDriversWithCashBlockRules = (
    await getDriversWithActiveCashBlockRules()
  ).map(({ driver_id }) => driver_id);

  const driversToIgnore = await readDCBRSheetColumnA('drivers');
  const autoParksToIgnore = await readDCBRSheetColumnA('autoparks');

  const { rows: drivers } = await getAllWorkingDriverIds({
    ids: IdsOfDriversWithCashBlockRules,
    year,
    weekNumber,
    maxDebt,
    driversToIgnore,
    autoParksToIgnore,
  });

  console.log(drivers)
  console.log({
    message: 'setDriverCashBlockRules',
    date: new Date(),
    env: process.env.ENV,
    drivers: drivers.length,
    driversToIgnore: driversToIgnore.length,
    autoParksToIgnore: autoParksToIgnore.length,
    IdsOfDriversWithCashBlockRules: IdsOfDriversWithCashBlockRules.length,
  });
  
  return;
  for (const driver of drivers) {
    try {
      const { driver_id, auto_park_id } = driver;
      const { cashBlockRules } = calculateDriverCashBlockRules();
      const { variables } = calculateMutationVariables({
        auto_park_id,
        driver_id,
        cashBlockRules,
      });

      const { success, errors } = await editDriverCashBlockRulesMutation({
        variables,
      });
      if (!success) {
        throw errors;
      }

      const { rows } = await getTheMostRecentDriverCashBlockRuleIdByDriverId({
        driver_id,
      });
      const { id: driver_cash_block_rule_id } = rows[0];
      await insertDriverWithCashBlockRules({
        driver_id,
        driver_cash_block_rule_id,
      });
    } catch (error) {
      console.error('error while setDriverCashBlockRules', error);
      continue;
    }
  }
};
export const updateDriverCashBlockRules = async () => {
  const { year, weekNumber } = calculateCurrentWeekAndYear();
  const driversWithCashBlockRules = await getDriversWithActiveCashBlockRules();
  const IdsOfDriversWithCashBlockRules = driversWithCashBlockRules.map(
    ({ driver_id }) => driver_id
  );

  const { rows: drivers } = await getDriversWhoPaidOff({
    year,
    weekNumber,
    ids: IdsOfDriversWithCashBlockRules,
  });
  console.log({
    message: 'updateDriverCashBlockRules',
    date: new Date(),
    env: process.env.ENV,
    drivers: drivers.length,
    IdsOfDriversWithCashBlockRules: IdsOfDriversWithCashBlockRules.length,
  });
  if (drivers.length === 0) {
    return;
  }
  for (const driver of drivers) {
    try {
      const { driver_id } = driver;
      const { driver_cash_block_rule_id } = driversWithCashBlockRules.find(
        (d) => d.driver_id === driver_id
      );

      const { success, errors } = await deleteDriverCustomCashBlockRuleMutation(
        {
          driver_id,
          driver_cash_block_rule_id,
        }
      );
      await markDriverCashBlockRulesAsDeleted({ driver_id });
      if (!success) {
        throw errors;
      }
    } catch (error) {
      console.error({
        date: new Date(),
        message: 'error while updateDriverCashBlockRules',
        error,
      });
      continue;
    }
  }
};

if (process.env.ENV == 'TEST') {
  // console.log({ driversToOmit, driverToOmit });
  // await openSShTunnel;
  // const drivers = [
  //   {
  //     driver_id: '38c9a2f7-c95d-4a1e-b481-661de8486539',
  //     auto_park_id: 'e2017b70-8418-4a1b-9bf8-aec8a3ad5241',
  //   },
  // ];
  await setDriverCashBlockRules();
  // await updateDriverCashBlockRules(drivers);
}
