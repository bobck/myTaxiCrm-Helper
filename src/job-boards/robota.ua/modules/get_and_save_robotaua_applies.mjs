import {
  getAllActiveRobotaUaVacancies,
  updateVacancyProgress,
} from '../robotaua.queries.mjs';
import {
  checkIfRobotaUaVacancyStaysActive,
  getRobotaUaVacancyApplies,
} from '../robotaua.utils.mjs';
import {
  addCommentToEntity,
  createVacancyResponseCards,
} from '../../../bitrix/bitrix.utils.mjs';
import { assignPayloadToVacancyApply } from '../../job-board.utils.mjs';
import { processApiResponse } from '../robotaua.business-entity.mjs';
import { cityListWithAssignedBy as bitrixCities } from '../../../bitrix/bitrix.constants.mjs';
import { robotaUaCities } from '../robotaua.constants.mjs';
import { devLog } from '../../../shared/shared.utils.mjs';
import { vacancyRequestTypeId } from '../../job-board.constants.mjs';
export const getAndSaveRobotaUaVacancyApplies = async () => {
  const { activeVacancies } = await getAllActiveRobotaUaVacancies();
  console.log({
    module: 'getAndSaveRobotaUaVacancyApplies',
    date: new Date(),
    activeVacancies: activeVacancies.length,
  });

  for (const [index, vacancy] of activeVacancies.entries()) {
    devLog(vacancy);
    const {
      robota_ua_vacancy_id,
      bitrix_vacancy_id,
      last_apply_date,
      region,
      name,
      assigned_by_id,
    } = vacancy;
    const { is_active } = await checkIfRobotaUaVacancyStaysActive({
      robota_ua_vacancy_id,
    });
    if (!is_active) {
      const comment = `Вакансія robota.ua id:${robota_ua_vacancy_id} не активна. Щоб її активувати - необхідно перенести до стадії "оновити-додати до системи", потім знову до "Пошук"`;
      devLog({ comment });
      await addCommentToEntity({
        comment,
        typeId: vacancyRequestTypeId,
        entityId: bitrix_vacancy_id,
      });
      continue;
    }
    const { applies: _applies } = await getRobotaUaVacancyApplies({
      vacancy_id: robota_ua_vacancy_id,
      last_apply_date,
    });
    if (_applies.length === 0) {
      continue;
    }

    const robota_ua_city = robotaUaCities.find((city) => city.id === region);
    const { brandingId: bitrix_city_id } = bitrixCities.find(
      (bitrixCity) => robota_ua_city.auto_park_id === bitrixCity.auto_park_id
    );

    const applies = assignPayloadToVacancyApply({
      applies: _applies,
      payload: {
        title: `${name} ${robota_ua_city.name}`,
        bitrix_city_id,
        bitrix_vacancy_id,
        assigned_by_id,
      },
    });
    const processedApplies = applies.map(processApiResponse);

    await createVacancyResponseCards({ dtos: processedApplies });
    devLog(
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
      last_apply_date: theLatestApplyDate,
    });
  }
};

if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  await getAndSaveRobotaUaVacancyApplies();
}
