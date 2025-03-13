import { DateTime } from 'luxon';
import {
  getBrandingProcessByWeekNumber,
  getCrmBrandingCardByDriverId,
  updateBrandingCardByDriverId,
} from '../bitrix.queries.mjs';
import { updateDriverBrandingCardItem } from '../bitrix.utils.mjs';
import { getBrandingCardsInfo } from '../../web.api/web.api.utlites.mjs';
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

export async function updateDriverBrandingCards() {
  const today = DateTime.local().startOf('day');
  const brandingProcess = await getBrandingProcessByWeekNumber({
    weekNumber: today.weekNumber,
    year: today.year,
  });
  const { rows } = await getBrandingCardsInfo({
    period_from: brandingProcess.period_from,
    period_to: brandingProcess.period_to,
  });

  if (rows.length === 0) {
    console.error('No rows found for branding cards found.');
    return;
  }
  for (const [index, row] of rows.entries()) {
    if (
      process.env.ENV === 'TEST' &&
      index === Number(process.env.BRANDING_CARDS_COUNT)
    ) {
      return;
    }
    const { driver_id, total_trips } = row;
    const { weekNumber, year } = brandingProcess;
    const dbcard = await getCrmBrandingCardByDriverId({
      ...row,
      weekNumber,
      year,
    });
    if (!dbcard) {
      console.error(
        `Absent driver card while updating driver_id: ${driver_id}, year:${year}, weekNumber:${weekNumber} `
      );
      continue;
    }

    if (Number(dbcard.total_trips) <= Number(total_trips)) {
      const stage_id = `DT1138_62:${computeBrandingCardStage(total_trips)}`;

      const card = {
        driver_id,
        bitrix_card_id: dbcard.bitrix_card_id,
        stage_id,
        total_trips,
      };

      const bitrixResp = await updateDriverBrandingCardItem(card);

      const dbupdate = await updateBrandingCardByDriverId({
        branding_process_id: brandingProcess.id,
        driver_id,
        total_trips,
      });
    }
  }
}
if (process.env.ENV === 'TEST') {
  console.log(
    `testing driver branding updating\ncards count :${process.env.BRANDING_CARDS_COUNT}`
  );
  await openSShTunnel;
  await updateDriverBrandingCards();
}
