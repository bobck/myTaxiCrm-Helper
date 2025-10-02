import { getAllCustomRuledAutoParksFromSpreadSheet } from '../sheets.utils.mjs';
import {
  getAutoParkCustomCashBlockRules,
  synchronizeAutoParkRulesTransaction,
} from '../../web.api/web.api.queries.mjs';
import { isUuid } from '../../shared/shared.utils.mjs';

const verifyAutoParkCustomCashBlockRule = async (rule) => {
  let result = true;
  const errors = [];
  const {
    auto_park_id,
    mode,
    target,
    balanceActivationValue,
    depositActivationValue,
    maxDebt,
  } = rule;
  if (!auto_park_id || !mode || !target || !maxDebt) {
    errors.push('!auto_park_id || !mode || !target || !maxDebt is true');
    result = false;
  }
  if (!isUuid(auto_park_id) || auto_park_id == 'DEFAULT') {
    errors.push('!isUuid(auto_park_id) || auto_park_id == "DEFAULT" is true');
    result = false;
  }

  if ((target == 'BOTH' || target == 'BALANCE') && !balanceActivationValue) {
    errors.push(
      '(target == "BOTH" || target == "BALANCE") && !balanceActivationValue is true'
    );
    result = false;
  }
  if ((target == 'BOTH' || target == 'DEPOSIT') && !depositActivationValue) {
    errors.push(
      '(target == "BOTH" || target == "DEPOSIT") && !depositActivationValue is true'
    );
    result = false;
  }
  if (!result) {
    console.error({
      function: 'verifyAutoParkCustomCashBlockRule',
      date: new Date(),
      errors,
      rule,
    });
  }
  return result;
};
const ifRulesAreEqueal = (rule1, rule2) => {
  if (rule1.auto_park_id !== rule2.auto_park_id) {
    return false;
  }
  if (rule1.mode !== rule2.mode) {
    return false;
  }
  if (rule1.target !== rule2.target) {
    return false;
  }
  if (rule1.balanceActivationValue !== rule2.balanceActivationValue) {
    return false;
  }
  if (rule1.depositActivationValue !== rule2.depositActivationValue) {
    return false;
  }
  if (rule1.maxDebt !== rule2.maxDebt) {
    return false;
  }

  return true;
};

export const synchronizeAutoParkCustomCashBlockRules = async () => {
  const activeAutoParkRules = await getAutoParkCustomCashBlockRules();

  const autoParkRulesFromSheet =
    await getAllCustomRuledAutoParksFromSpreadSheet();
  if (!autoParkRulesFromSheet) {
    console.error({
      module: 'synchronizeAutoParkCustomCashBlockRules',
      date: new Date(),
      autoParkRulesFromSheet,
      message: 'google spread sheet API failed',
    });
    return;
  }

  const verifiedAutoParksFromSheet = autoParkRulesFromSheet.filter(
    verifyAutoParkCustomCashBlockRule
  );
  // console.log({ verifiedAutoParksFromSheet, activeAutoParkRules })
  // return;

  if (verifiedAutoParksFromSheet.length < autoParkRulesFromSheet.length) {
    console.error({
      date: new Date(),
      module: 'synchronizeAutoParkCustomCashBlockRules',
      message: 'Some rules are invalid',
    });
    return;
  }

  const newAutoParkRules = verifiedAutoParksFromSheet.reduce((acc, rule) => {
    if (
      !activeAutoParkRules.some((activeRule) =>
        ifRulesAreEqueal(activeRule, rule)
      )
    ) {
      acc.push(rule);
    }

    return acc;
  }, []);
  const deletedAutoParkRules = activeAutoParkRules.reduce((acc, rule) => {
    if (
      !verifiedAutoParksFromSheet.some((activeRule) =>
        ifRulesAreEqueal(activeRule, rule)
      )
    ) {
      acc.push(rule);
    }
    return acc;
  }, []);
  const deletedAutoParkRuleIds = deletedAutoParkRules.map(
    ({ rule_id }) => rule_id
  );

  console.log({
    message: 'synchronizeAutoParksExcludedFromDCBRSetting',
    date: new Date(),
    newAutoParks: newAutoParkRules.length,
    deletedAutoParks: deletedAutoParkRules.length,
  });
  await synchronizeAutoParkRulesTransaction({
    newAutoParkRules,
    deletedAutoParkRuleIds,
  });
};

if (process.env.ENV == 'TEST') {
  synchronizeAutoParkCustomCashBlockRules();
}
