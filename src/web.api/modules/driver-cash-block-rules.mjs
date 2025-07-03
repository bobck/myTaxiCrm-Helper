import { DateTime } from 'luxon';
import { openSShTunnel } from '../../../ssh.mjs';
import {
  getDriversWithActiveCashBlockRules,
  insertDriverWithCashBlockRules,
  markDriverCashBlockRulesAsDeleted,
} from '../web.api.queries.mjs';
import {
  getAllWorkingDriverIds,
  makeCRMRequestlimited,
  getDriversWhoPaidOff,
} from '../web.api.utlites.mjs';

const activationValue = 200;

const driversToOmit = [
  '21361ee9-dac3-4f70-8434-885945abaaab',
  '571cc438-a05a-44c8-a159-2e448bc27e49',
  '2bc07bdc-b04d-486c-af6a-b68a7aec2d67',
];

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
    await makeCRMRequestlimited({ body: bodyForEditRules });
  } catch (errors) {
    const [error] = errors;
    const { message, locations, path, extensions } = error;

    throw { message, locations, path, extensions, variables };
  }
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
  const { rows: drivers } = await getAllWorkingDriverIds({
    ids: IdsOfDriversWithCashBlockRules,
    year,
    weekNumber,
    activationValue: activationValue * -1,
    driversToOmit,
  });

  console.log({
    message: 'setdriverCashBlockRules',
    date: new Date(),
    env: process.env.ENV,
    drivers: drivers.length,
    IdsOfDriversWithCashBlockRules: IdsOfDriversWithCashBlockRules.length,
  });
  // return;
  for (const driver of drivers) {
    try {
      const { driver_id, auto_park_id } = driver;
      const { cashBlockRules } = calculateDriverCashBlockRules();
      const { variables } = calculateMutationVariables({
        auto_park_id,
        driver_id,
        cashBlockRules,
      });
      await editDriverCashBlockRulesMutation({ variables });
      await insertDriverWithCashBlockRules({ driver_id });
    } catch (error) {
      console.error('error while setDriverCashBlockRules', error);
      continue;
    }
  }
};
export const updateDriverCashBlockRules = async () => {
  const { year, weekNumber } = calculateCurrentWeekAndYear();
  const IdsOfDriversWithCashBlockRules = (
    await getDriversWithActiveCashBlockRules()
  ).map(({ driver_id }) => driver_id);
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
      const { driver_id, auto_park_id } = driver;
      const { variables } = calculateMutationVariables({
        auto_park_id,
        driver_id,
        cashBlockRules: [],
      });
      await editDriverCashBlockRulesMutation({ variables });
      await markDriverCashBlockRulesAsDeleted({ driver_id });
    } catch (error) {
      console.error('error while updateDriverCashBlockRules', error);
      continue;
    }
  }
};

if ((process.env.ENV = 'TEST')) {
  await openSShTunnel;
  // await updateDriverCashBlockRules();
  await setDriverCashBlockRules();
}
