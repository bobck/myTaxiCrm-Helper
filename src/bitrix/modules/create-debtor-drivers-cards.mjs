import { getFiredDebtorDriversInfo } from '../../web.api/web.api.utlites.mjs';
import { cityListWithAssignedBy as cityList } from '../bitrix.constants.mjs';
import { openSShTunnel } from '../../../ssh.mjs';

function computeBrandingCardStage(total_trips) {
  let trips = Number(total_trips);
  if (isNaN(trips)) {
    console.error('Trips must be a number');
  }
  if (trips >= 90) {
    return 'PREPARATION';
  } else if (trips < 30) {
    return 'CLIENT';
  } else {
    return 'NEW';
  }
}

export async function createFiredDebtorDriversCards() {
  const { rows } = await getFiredDebtorDriversInfo();

  if (rows.length === 0) {
    console.error('No rows found for fired debtor drivers found.');
    return;
  }
  for (const [index, row] of rows.entries()) {
    // if (
    //   process.env.ENV === 'TEST' &&
    //   index ===320
    // ) {
    //   return;
    // }
    if (row.is_balance_enabled || row.is_deposit_enabled) {
      console.log(row);
    }
    // const {
    //   full_name,
    //   auto_park_id,
    //   cs_current_week,
    //   cs_current_year,
    //   current_week_balance,
    //   current_week_total_deposit,
    //   current_week_total_debt,
    //   fire_date,
    //   is_balance_enabled,
    //   balance_activation_value,
    //   is_deposit_enabled,
    //   deposit_activation_value
    // } = row;
    // console.log({
    //   full_name,
    //   auto_park_id,
    //   cs_current_week,
    //   cs_current_year,
    //   current_week_balance,
    //   current_week_total_deposit,
    //   current_week_total_debt,
    //   fire_date,
    //   is_balance_enabled,
    //   balance_activation_value,
    //   is_deposit_enabled,
    //   deposit_activation_value
    // })

    // const dbcard = await getCrmBrandingCardByDriverId({
    //     driver_id,
    //     weekNumber,
    //     year,
    // });
    // if (dbcard) {
    //     console.error(`Present driver card while creating driver_id:${driver_id}, year:${year}, weekNumber:${weekNumber}`);
    //     continue;
    // }
    //
    // const stage_id = `DT1138_62:${computeBrandingCardStage(total_trips)}`;
    // const myTaxiDriverUrl = `https://fleets.mytaxicrm.com/${auto_park_id}/drivers/${driver_id}`;
    // const cityBrandingId = getCityBrandingId(auto_park_id);
    // const card = {
    //     driver_id,
    //     driver_name,
    //     stage_id,
    //     phone,
    //     myTaxiDriverUrl,
    //     total_trips,
    //     weekNumber,
    //     year,
    //     cityBrandingId,
    // };
    // const bitrixResp = await createDriverBrandingCardItem(card);
    //
    // await insertBrandingCard({
    //     ...bitrixResp,
    //     branding_process_id:brandingProcess.id
    // });
  }
}

if (process.env.ENV === 'TEST') {
  console.log(
    `testing fired debtor drivers creation\ncards count :${(process.env.DEBTOR_DRIVERS_CARDS_COUNT = 4)}`
  );
  await openSShTunnel;
  await createFiredDebtorDriversCards();
}
