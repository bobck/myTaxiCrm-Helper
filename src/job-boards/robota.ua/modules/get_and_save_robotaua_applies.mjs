import {
  getAllActiveRobotaUaVacancies,
  updateVacancyProgress,
} from '../robotaua.queries.mjs';
import { getCityList, getRobotaUaVacancyApplies } from '../robotaua.utils.mjs';
import { createVacancyResponseCards, createVacancyResponseCardsTEST } from '../../../bitrix/bitrix.utils.mjs';
import { assignVacancyTitleToApplies } from '../../job-board.utils.mjs';
import { processApiResponse } from '../robotaua.business-entity.mjs';
import { cityListWithAssignedBy as bitrixCities } from '../../../bitrix/bitrix.constants.mjs';
import { robotaUaCities } from '../robotaua.constants.mjs';
import { devLog } from '../../../shared/shared.utils.mjs';
export const getAndSaveRobotaUaVacancyApplies = async () => {
  console.log({
    module: 'getAndSaveRobotaUaVacancyApplies',
    date: new Date(),
  });
  // const cities = await getCityList();
  const { activeVacancies } = await getAllActiveRobotaUaVacancies();

  for (const [index, vacancy] of activeVacancies.entries()) {
    console.log(vacancy);
    const {
      robota_ua_vacancy_id,
      bitrix_vacancy_id,
      is_active,
      last_apply_date,
      region,
      name,
    } = vacancy;

    const robota_ua_city = robotaUaCities.find((city) => city.id === region);
    const { brandingId: bitrix_city_id } = bitrixCities.find(
      (bitrixCity) => robota_ua_city.auto_park_id === bitrixCity.auto_park_id
    );
    const { applies: _applies } = await getRobotaUaVacancyApplies({
      vacancy_id: robota_ua_vacancy_id,
      last_apply_date,
    });
    // console.log(
    //   _applies.map((apply) => {
    //     const { id, addDate } = apply;
    //     return { id, addDate };
    //   })
    // );

    const applies = assignVacancyTitleToApplies({
      applies: _applies,
      title: `${name} ${robota_ua_city.name}`,
      bitrix_city_id,
    }).slice(17);
    console.log(applies)
    return 
    const processedApplies = applies.map(processApiResponse);

    await createVacancyResponseCardsTEST({ dtos: processedApplies });
    return
    await createVacancyResponseCards({ dtos: processedApplies });
    console.log(
      applies.map((apply) => {
        const { id, addDate } = apply;
        return { id, addDate };
      })
    );
    //robota ua employee api returns vacancy applies FROM THE NEWEST TO THE OLDEST.
    const [theLatestApply] = applies;
    const { addDate: theLatestApplyDate } = theLatestApply;
    devLog({ theLatestApplyDate });
    await updateVacancyProgress({
      robota_ua_vacancy_id,
      last_apply_date: applies[applies.length - 1].addDate,
    });
  }
};

if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  // await getAndSaveRobotaUaVacancies();
  await getAndSaveRobotaUaVacancyApplies();
}
