import { openSShTunnel } from '../../../ssh.mjs';
import {
  getAllWorkingDriverIds,
  makeCRMRequestlimited,
} from '../web.api.utlites.mjs';
const activationValue = 1000;
const calculateDriverCashBlockRules = ({ driver_balance }) => {
  const cashBlockRule = {
    activationValue,
    isEnabled: true,
    target: 'BALANCE',
  };
  const cashBlockRules = [];
  if (cashBlockRule.isEnabled) cashBlockRules.push(cashBlockRule);
  return { cashBlockRules };
};

export const driverCashBlockRules = async () => {
  const { rows: drivers } = await getAllWorkingDriverIds();
  console.log({
    message: 'driverCashBlockRules',
    date: new Date(),
    env: process.env.ENV,
    drivers: drivers.length,
  });
  for (const driver of drivers) {
    const { cashBlockRules } = calculateDriverCashBlockRules(driver);
    const { driver_id, auto_park_id } = driver;
    const variables = {
      editDriverCashBlockRulesInput: {
        autoParkId: auto_park_id,
        driverId: driver_id,
        isEnabled: cashBlockRules.length > 0,
        mode: 'MIN_DEBT', // MAX_DEBT | MIN_DEBT
        // balance: driver.driver_balance,
        rules: cashBlockRules,
      },
    };

    if (!variables.editDriverCashBlockRulesInput.isEnabled) {
      console.log(
        `skipping ${variables.editDriverCashBlockRulesInput.driverId}`
      );
      continue;
    }
    const editRulesQueryString = `
    mutation EditDriverCashBlockRules($editDriverCashBlockRulesInput: EditDriverCashBlockRulesInput!) {
      editDriverCashBlockRules(editDriverCashBlockRulesInput: $editDriverCashBlockRulesInput) {
        success
      }
    }`;
    const query =
      'mutation EditDriverCashBlockRules($editDriverCashBlockRulesInput: EditDriverCashBlockRulesInput!) {\n  editDriverCashBlockRules(editDriverCashBlockRulesInput: $editDriverCashBlockRulesInput) {\n    success\n  }\n}';
    const bodyForEditRules = {
      operationName: 'EditDriverCashBlockRules',
      variables,
      query,
    };

    try {
      const response = await makeCRMRequestlimited({ body: bodyForEditRules });
      console.log(response, { driver_id, auto_park_id });
    } catch (errors) {
      const { message, locations, path, extensions } = errors[0];
      console.error(
        'Ошибка при изменении правил:',
        { driver_id, auto_park_id },
        { message, locations, path, extensions }
      );
    }
  }
  console.log(`done :)`);
};

if ((process.env.ENV = 'TEST')) {
  await openSShTunnel;
  await driverCashBlockRules();
}
