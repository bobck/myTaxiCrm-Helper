import { getAllRowsAsObjects } from '../sheets.utils.mjs';
import {
  createAutoParksExcludedFromDCBR,
  deactivateAutoParksExcludedFromDCBR,
  getAutoParkCustomCashBlockRules,
  synchronizeAutoParkRulesTransaction,
} from '../../web.api/web.api.queries.mjs';
import { isUuid } from '../../shared/shared.utils.mjs';

const verifyAutoParkCustomCashBlockRule = async (rule) => {

  const {
    auto_park_id,
    mode,
    target,
    balanceActivationValue,
    depositActivationValue,
    maxDebt,
  } = rule;
  if (!auto_park_id || !mode || !target || !maxDebt) {
    return false;
  }
  if (!isUuid(auto_park_id) || auto_park_id == 'DEFAULT') {
    return false;
  }
  if (
    (target == 'BOTH' || target == 'BALANCE') &&
    !balanceActivationValue
  ) {
    return false;
  }
  if (
    (target == 'BOTH' || target == 'DEPOSIT') &&
    !depositActivationValue
  ) {
    return false;
  }
  return true;

}
const ifRulesAreEqueal = (rule1, rule2) => {
  if (rule1.auto_park_id !== rule2.auto_park_id) { return false; }
  if (rule1.mode !== rule2.mode) { return false; }
  if (rule1.target !== rule2.target) { return false; }
  if (rule1.balanceActivationValue !== rule2.balanceActivationValue) { return false; }
  if (rule1.depositActivationValue !== rule2.depositActivationValue) { return false; }
  if (rule1.maxDebt !== rule2.maxDebt) { return false; }



  return true;
}


export const synchronizeAutoParkCustomCashBlockRules = async () => {
  const activeAutoParkRules = await getAutoParkCustomCashBlockRules();
  const autoParkRulesFromSheet = await getAllRowsAsObjects();

  // console.log(autoParkRulesFromSheet)
  // return;
  // const excludedAutoParkIds = autoParkRules.map(
  //   ({ auto_park_id }) => auto_park_id
  // );
  const verifiedAutoParksFromSheet = autoParkRulesFromSheet.filter(verifyAutoParkCustomCashBlockRule);


  const newAutoParkRules = verifiedAutoParksFromSheet.reduce((acc, rule) => {

    if (!activeAutoParkRules.some(activeRule => ifRulesAreEqueal(activeRule, rule))) {
      acc.push(rule);
    }

    return acc;
  },
    []
  )
  const deletedAutoParkRules = activeAutoParkRules.reduce((acc, rule) => {
    if (!verifiedAutoParksFromSheet.some(activeRule => ifRulesAreEqueal(activeRule, rule))) {
      acc.push(rule);
    }
    return acc;
  }, []);
  const deletedAutoParkRuleIds = deletedAutoParkRules.map(
    ({ rule_id }) => rule_id
  );

  console.log({ newAutoParkRules, deletedAutoParkRules })
  console.log({
    message: 'synchronizeAutoParksExcludedFromDCBRSetting',
    date: new Date(),
    newAutoParks: newAutoParkRules.length,
    deletedAutoParks: deletedAutoParkRules.length,
  });
  await synchronizeAutoParkRulesTransaction({ newAutoParkRules, deletedAutoParkRuleIds });
};

if (process.env.ENV == 'TEST') {
  synchronizeAutoParkCustomCashBlockRules();
}
