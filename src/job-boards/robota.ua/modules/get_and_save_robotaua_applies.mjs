import { getAllActiveVacancies } from '../robotaua.queries.mjs';
import { getCityList, getVacancyApplies } from '../robotaua.utils.mjs';
import { createVacancyResponseCards } from '../../../bitrix/bitrix.utils.mjs';
import { assignVacancyTitleToApplies } from '../../job-boards.utils.mjs';
import { processApiResponse } from '../robotaua.business-entity.mjs';
import { cityListWithAssignedBy as bitrixCities } from '../../../bitrix/bitrix.constants.mjs';
import { robotaUaCities } from '../robotaua.constants.mjs';
export const getAndSaveRobotaUaVacancyApplies = async () => {
  console.log({
    module: 'getAndSaveRobotaUaVacancyApplies',
    date: new Date(),
  });
  // const cities = await getCityList();
  const { activeVacancies } = await getAllActiveVacancies();
  const applies = [];
  for (const [index, vacancy] of activeVacancies.entries()) {
    // console.log(vacancy);
    const { vacancy_name, vacancy_id, robota_ua_city_id } = vacancy;
    const robota_ua_city = robotaUaCities.find(
      (city) => city.id === robota_ua_city_id
    );
    const { brandingId: bitrix_city_id } = bitrixCities.find(
      (bitrixCity) => robota_ua_city.auto_park_id === bitrixCity.auto_park_id
    );
    const { applies: _applies } = await getVacancyApplies({ vacancy_id });
    applies.push(
      ...assignVacancyTitleToApplies({
        applies: _applies,
        title: `${vacancy_name} ${robota_ua_city.name}`,
        bitrix_city_id,
      })
    );

    const processedApplies = applies.map(processApiResponse);
    await createVacancyResponseCards({ dtos: processedApplies });
    if (index === 0) {
      break;
    }
  }
};

if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  // await getAndSaveRobotaUaVacancies();
  await getAndSaveRobotaUaVacancyApplies();
}
