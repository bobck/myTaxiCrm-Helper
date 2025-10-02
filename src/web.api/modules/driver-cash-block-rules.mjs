import { DateTime } from 'luxon';
import { openSShTunnel } from '../../../ssh.mjs';
import {
  getAutoParkCustomCashBlockRules,
  getAutoParkRulesByIds,
  getAutoParksExcludedFromCashBlockRules,
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
  getAllWorkingDriverIdsByAutoPark,
} from '../web.api.utlites.mjs';

const calculateDriverCashBlockRules = ({ rule }) => {
  const { target, balanceActivationValue, depositActivationValue } = rule;

  const cashBlockRules = [];
  if ((target == 'BOTH' || target == 'BALANCE') && balanceActivationValue) {
    const balanceCashBlockRule = {
      activationValue: balanceActivationValue,
      isEnabled: true,
      target: 'BALANCE',
    };

    cashBlockRules.push(balanceCashBlockRule);
  }
  if ((target == 'BOTH' || target == 'DEPOSIT') && depositActivationValue) {
    const depositCashBlockRule = {
      activationValue: depositActivationValue,
      isEnabled: true,
      target: 'DEPOSIT',
    };

    cashBlockRules.push(depositCashBlockRule);
  }
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
  mode,
}) => {
  const variables = {
    editDriverCashBlockRulesInput: {
      autoParkId: auto_park_id,
      driverId: driver_id,
      isEnabled: cashBlockRules.length > 0,
      mode,
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
  const autoParksToIgnore = (
    await getAutoParksExcludedFromCashBlockRules()
  ).map(({ auto_park_id }) => auto_park_id);
  const driversToIgnore = (await getDriversIgnoringCashBlockRules()).map(
    ({ driver_id }) => driver_id
  );
  const autoParkRules = await getAutoParkCustomCashBlockRules();
  const defaultRule = autoParkRules.find(
    ({ auto_park_id }) => auto_park_id === 'DEFAULT'
  );
  const customAutoParkRules = autoParkRules.filter(
    ({ auto_park_id }) => auto_park_id !== 'DEFAULT'
  );

  const drivers = [];

  if (customAutoParkRules.length > 0) {
    for (const autoParkRule of customAutoParkRules) {
      const { auto_park_id, maxDebt } = autoParkRule;
      const { rows } = await getAllWorkingDriverIdsByAutoPark({
        ids: IdsOfDriversWithCashBlockRules,
        year,
        weekNumber,
        maxDebt,
        driversToIgnore,
        auto_park_id,
      });
      drivers.push(...rows);
    }
  }

  const { maxDebt } = defaultRule;
  const { rows } = await getAllWorkingDriverIds({
    ids: IdsOfDriversWithCashBlockRules,
    year,
    weekNumber,
    maxDebt,
    driversToIgnore,

    autoParksToIgnore: [
      ...autoParksToIgnore,
      ...customAutoParkRules.map(({ auto_park_id }) => auto_park_id),
    ],

  });
  drivers.push(...rows);

  console.log({
    message: 'setDriverCashBlockRules',
    date: new Date(),
    env: process.env.ENV,
    drivers: drivers.length,
    driversToIgnore: driversToIgnore.length,
    autoParksToIgnore: autoParksToIgnore.length,
    IdsOfDriversWithCashBlockRules: IdsOfDriversWithCashBlockRules.length,
    customAutoParkRules: customAutoParkRules.length,
    defaultRule,
  });

  for (const driver of drivers) {
    try {
      const { driver_id, auto_park_id } = driver;
      const rule =
        customAutoParkRules.find(
          (autopark) => autopark.auto_park_id === auto_park_id
        ) || defaultRule;
      const { cashBlockRules } = calculateDriverCashBlockRules({ rule });
      const { variables } = calculateMutationVariables({
        auto_park_id,
        driver_id,
        cashBlockRules,
        mode: rule.mode,
      });

      const { success, errors } = await editDriverCashBlockRulesMutation({
        variables,
      });
      if (!success) {
        throw {
          error: e,
          date: new Date(),
          module: 'setDriverCashBlockRules',
          driver_id,
          auto_park_id,
          cashBlockRules,
          rule,
          errors,
        };
      }

      const { rows } = await getTheMostRecentDriverCashBlockRuleIdByDriverId({
        driver_id,
      });
      const { id: driver_cash_block_rule_id } = rows[0];
      await insertDriverWithCashBlockRules({
        driver_id,
        driver_cash_block_rule_id,
        rule_id: rule.rule_id,
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
  const autoParkRuleIds = new Set(
    driversWithCashBlockRules.map(({ auto_park_rule_id }) => auto_park_rule_id)
  );

  const autoParkRules = await getAutoParkRulesByIds({
    rule_ids: [...autoParkRuleIds],
  });

  const autoParkRuleMap = new Map(
    autoParkRules.map((rule) => [rule.rule_id, rule])
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
    autoParkRuleIds: autoParkRuleIds.size,
    IdsOfDriversWithCashBlockRules: IdsOfDriversWithCashBlockRules.length,
  });
  if (drivers.length === 0) {
    return;
  }
  for (const driver of drivers) {
    try {
      const { driver_id, driver_balance } = driver;
      const driverCashBlockRule = driversWithCashBlockRules.find(
        (d) => d.driver_id === driver_id
      );
      const { auto_park_rule_id, driver_cash_block_rule_id } =
        driverCashBlockRule;
      const rule = autoParkRuleMap.get(auto_park_rule_id);
      const { maxDebt } = rule;

      if (driver_balance < maxDebt) {
        continue;
      }

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
      console.error('error while updateDriverCashBlockRules', error);
      continue;
    }
  }
};

if (process.env.ENV == 'TEST') {
  await openSShTunnel;
  // await updateDriverCashBlockRules();
  await setDriverCashBlockRules();
}
