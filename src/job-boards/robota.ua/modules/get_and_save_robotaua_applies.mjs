import {
  getAllActiveRobotaUaVacancies,
  getLastRobotaUaApplyDate,
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

export const getAndSaveRobotaUaVacancyApplies = async () => {
  const { activeVacancies } = await getAllActiveRobotaUaVacancies();
  const activeVacanciesMap = new Map(
    activeVacancies.map((vacancy) => [vacancy.robota_ua_vacancy_id, vacancy])
  );
  const activeVacancyAppliesMap = new Map(
    activeVacancies.map((vacancy) => [vacancy.robota_ua_vacancy_id, []])
  );

  //getting applies by the newest last update date
  const { last_apply_date } = await getLastRobotaUaApplyDate();
  const { applies } = await getRobotaUaVacancyApplies({
    last_apply_date,
  });
  devLog({ applies });
  return;
  const logInfo = {
    module: 'getAndSaveRobotaUaVacancyApplies',
    date: new Date(),
    activeVacancies: activeVacancies.length,
    processedApplies: 0,
    last_apply_date,
  };
  //aggregating
  for (const apply of applies) {
    if (!activeVacancyAppliesMap.has(apply.vacancyId)) {
      continue;
    }
    activeVacancyAppliesMap.get(apply.vacancyId).push(apply);
  }

  //applies processing
  for (const [vacancyId, applies] of activeVacancyAppliesMap) {
    if (applies.length === 0) {
      devLog('no new applies', vacancyId);
      continue;
    }
    const {
      robota_ua_vacancy_id,
      bitrix_vacancy_id,
      region,
      name,
      assigned_by_id,
    } = activeVacanciesMap.get(vacancyId);

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

    const robota_ua_city = robotaUaCities.find((city) => city.id === region);
    const { brandingId: bitrix_city_id } = bitrixCities.find(
      (bitrixCity) => robota_ua_city.auto_park_id === bitrixCity.auto_park_id
    );

    const appliesWithAssignedPayload = assignPayloadToVacancyApply({
      applies,
      payload: {
        title: `${name} ${robota_ua_city.name}`,
        bitrix_city_id,
        bitrix_vacancy_id,
        assigned_by_id,
      },
    });
    const processedApplies = appliesWithAssignedPayload.map(processApiResponse);
    await createVacancyResponseCards({ dtos: processedApplies });
    devLog({ vacancyId, applies: applies.length });
    //robota ua employee api returns vacancy applies FROM THE NEWEST TO THE OLDEST.
    const [theLatestApply] = applies;
    const { addDate: theLatestApplyDate } = theLatestApply;
    devLog({ theLatestApplyDate });
    await updateVacancyProgress({
      robota_ua_vacancy_id,
      last_apply_date: theLatestApplyDate,
    });
    logInfo.processedApplies += applies.length;
    return;
  }
  console.log(logInfo);
};
if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  await getAndSaveRobotaUaVacancyApplies();
}
