import { getBoltDriversToBan } from '../../web.api/web.api.utlites.mjs';
import {
  nameKeyWords,
  cityListWithAssignedBy as cityList,
} from '../bitrix.constants.mjs';
import { createBanBoltDriverCardItem } from '../bitrix.utils.mjs';
import { openSShTunnel } from '../../../ssh.mjs';
import { DateTime } from 'luxon';
import {
  getBoltDriverBanReqByDriverId,
  insertBoltDriverBanReq,
} from '../bitrix.queries.mjs';

const nameCheck = (full_name) => {
  return full_name
    .split(' ')
    .filter((w) => !nameKeyWords.some((keyWord) => keyWord === w.toLowerCase()))
    .join(' ');
};
function getCityBrandingId(auto_park_id) {
  return cityList.find((obj) => obj.auto_park_id === auto_park_id).brandingId;
}
function computeQueryParams() {
  const today = DateTime.local().startOf('day');

  const lowerBound = today.minus({ days: 8 });
  // Return the dates formatted as ISO strings (YYYY-MM-DD) for PostgreSQL
  return {
    period_from: lowerBound.toISODate(),
    weekNumber: today.weekNumber,
    year: today.year,
  };
}
export const createBoltDriversToBan = async () => {
  const queryParams = computeQueryParams();
  const { rows } = await getBoltDriversToBan(queryParams);

  if (rows.length === 0) {
    console.error('No any drivers to ban found.');
    return;
  }
  for (const [index, row] of rows.entries()) {
    if (
      process.env.ENV === 'TEST' &&
      index === Number(process.env.BOLT_DRIVERS_BAN_CARDS)
    ) {
      console.log('testing has been ended');
      return;
    }
    const { driver_id, auto_park_id, full_name, bolt_id, driver_balance } = row;

    const dbcard = await getBoltDriverBanReqByDriverId({ driver_id });

    if (dbcard) {
      console.error(
        {
    message:'Present driver bolt driver ban request card while creating',
    driver_id,
    process: 'createBoltDriversToBan',
}
      );
      continue;
    }
    const checkedName = nameCheck(full_name);
    const cityId = getCityBrandingId(auto_park_id);
    const isDebtor = Number(driver_balance) < 0;
    const debt = isDebtor ? String(-1 * driver_balance) : '0';
    const bitrixResp = await createBanBoltDriverCardItem({
      full_name: checkedName,
      bolt_id,
      cityId,
      debt,
      isDebtor,
    });
    const { bitrix_card_id } = bitrixResp;
    await insertBoltDriverBanReq({ bitrix_card_id, debt, driver_id });
  }
};

if (process.env.ENV === 'TEST') {
  console.log(
    `testing bolt drivers ban cards creation\ncards count :${process.env.BOLT_DRIVERS_BAN_CARDS}`
  );
  await openSShTunnel;
  await createBoltDriversToBan();
}
