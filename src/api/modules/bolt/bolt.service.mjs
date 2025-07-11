import * as BoltRepo from './bolt.repo.mjs';
import {
  handleDriverPhones,
  checkIfDriverStaysInTheSameCity,
} from './bolt.business-entity.mjs';
import {
  addCommentToEntity,
  moveRequestedDriversToCheckStage,
  updateRequestedDrivers,
} from '../../../bitrix/bitrix.utils.mjs';
import { insertBoltDriverToBan } from '../../../bitrix/bitrix.queries.mjs';
import { api_status_codes } from '../../api.constants.mjs';

const { BAD_REQUEST } = api_status_codes;

export const sentFirstLetterService = async ({ query }) => {
  const { phones, bolt_id: req_bolt_id, city_id, bitrix_deal_id } = query;

  const { phonesReadyToQuery } = handleDriverPhones({ phones });
  const updatePayload = { bitrix_deal_id };
  const { drivers } = await BoltRepo.getDrivers({
    phones: phonesReadyToQuery,
  });
  if (!drivers || drivers.length === 0) {
    console.log('No drivers found', query);
    await addCommentToEntity({
      entityId: bitrix_deal_id,
      typeId: 1132,
      comment:
        'Не знайдено жодного запису водія в MyTaxiCRM з поданими номерами телефонів.',
    });
    await moveRequestedDriversToCheckStage({
      cards: [{ bitrix_deal_id, phone: phones[0] }],
    });
    console.error({
      code: BAD_REQUEST,
      message: "Any bolt ID wasn't found",
    });
  }
  const [driver] = drivers;

  const { driver_id, auto_park_id, external_id: bolt_id, phone } = driver;
  const { checkResult, actualCityId } = await checkIfDriverStaysInTheSameCity({
    driver_id,
    auto_park_id,
    city_id,
  });
  if (!checkResult) {
    updatePayload.city_id = actualCityId;
  }
  if (bolt_id !== req_bolt_id) {
    updatePayload.bolt_id = bolt_id;
  }
  await insertBoltDriverToBan({
    driver_id,
    phone,
    bitrix_deal_id,
    bolt_id,
  });
  const cards = [
    {
      bitrix_deal_id,
      ...updatePayload,
    },
  ];
  await updateRequestedDrivers({
    cards,
  });
  console.log(query, 'done');
};

export const letterApprovementService = async ({ params, query }) => {
  let { letter_id } = params;
  letter_id = Number(letter_id);
  const { bitrix_deal_id } = query;
  if (!(letter_id === 1 || letter_id === 2)) {
    throw { code: BAD_REQUEST, message: `unknown letter_id:${letter_id}` };
  }
  if (!bitrix_deal_id) {
    throw { code: BAD_REQUEST, message: 'bitrix_deal_id is required' };
  }
  await BoltRepo.approveLetterByDealId({ bitrix_deal_id, letter_id });
};
