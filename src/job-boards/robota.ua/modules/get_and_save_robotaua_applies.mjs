import {
  getAllActiveRobotaUaVacancies,
  updateVacancyProgress,
} from '../robotaua.queries.mjs';
import { getCityList, getRobotaUaVacancyApplies } from '../robotaua.utils.mjs';
import { createVacancyResponseCards } from '../../../bitrix/bitrix.utils.mjs';
import { assignVacancyTitleToApplies } from '../../job-board.utils.mjs';
import { processApiResponse } from '../robotaua.business-entity.mjs';
import { cityListWithAssignedBy as bitrixCities } from '../../../bitrix/bitrix.constants.mjs';
import { robotaUaCities } from '../robotaua.constants.mjs';
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
    console.log(
      _applies.map((apply) => {
        const { id, addDate } = apply;
        return { id, addDate };
      })
    );
    // const filteredApplies = _applies.filter(
    //   (apply) => apply.id > last_apply_id
    // );
    // console.log(filteredApplies[0]);
    return;
    const applies = assignVacancyTitleToApplies({
      applies: _applies.filter((apply) => apply.id > last_apply_id),
      title: `${vacancy_name} ${robota_ua_city.name}`,
      bitrix_city_id,
    });

    const processedApplies = applies.map(processApiResponse);
    await createVacancyResponseCards({ dtos: processedApplies });

    const current_last_apply_id = applies.reduce(
      (acc, apply) => (apply.id > acc ? apply.id : acc),
      0
    );
    console.log(last_apply_id);
    await updateVacancyProgress({
      vacancy_id,
      last_page: 0,
      last_apply_id: current_last_apply_id,
    });
    if (index === 2) {
      console.log(applies);
      break;
    }
  }
};

if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  // await getAndSaveRobotaUaVacancies();
  await getAndSaveRobotaUaVacancyApplies();
}
