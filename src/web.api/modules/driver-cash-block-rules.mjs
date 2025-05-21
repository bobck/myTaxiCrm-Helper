import { openSShTunnel } from '../../../ssh.mjs';
import {
  getAllWorkingDriverIds,
  makeCRMRequestlimited,
} from '../web.api.utlites.mjs';
const activationValue = 1000;
const calculateDriverCashBlockRules = ({ driver_balance }) => {
  const cashBlockRule =
    driver_balance < -1000
      ? {
          activationValue,
          isEnabled: true,
          target: 'BALANCE',
        }
      : {};
  /**
   * {
          activationValue: null,
          isEnabled: null,
          target: null,
        },
   */
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
    console.log(variables.editDriverCashBlockRulesInput);
    if (!variables.editDriverCashBlockRulesInput.isEnabled) {
      console.log(
        `skipping ${variables.editDriverCashBlockRulesInput.driverId}`
      );
      continue;
    }
    // const editRulesQueryString = `
    // mutation EditDriverCashBlockRules($editDriverCashBlockRulesInput: EditDriverCashBlockRulesInput!) {
    //   editDriverCashBlockRules(editDriverCashBlockRulesInput: $editDriverCashBlockRulesInput) {
    //     success
    //   }
    // }`;
    const query =
      'mutation EditDriverCashBlockRules($editDriverCashBlockRulesInput: EditDriverCashBlockRulesInput!) {\n  editDriverCashBlockRules(editDriverCashBlockRulesInput: $editDriverCashBlockRulesInput) {\n    success\n  }\n}';
    const bodyForEditRules = {
      operationName: 'EditDriverCashBlockRules',
      variables,
      query,
    };
    console.log(bodyForEditRules);
    const response = await makeCRMRequestlimited({ body: bodyForEditRules });
    console.log(response)
    return
  }
  return;
  try {
    const { data } = response;
    // Обработка data.editDriverCashBlockRules.success и data.editDriverCashBlockRules.message
    console.log(data);
  } catch (error) {
    console.error('Ошибка при изменении правил:', error);
  }
};

if ((process.env.ENV = 'TEST')) {
  await openSShTunnel;
  await driverCashBlockRules();
}
