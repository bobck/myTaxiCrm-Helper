import { getAllBoltIdsByDriverPhone } from '../../web.api/web.api.utlites.mjs';
import {
  handleDriverPhone,
  checkIfDriverStaysInTheSameCity,
} from '../endpoints-utils.mjs';
import { createBoltDriverToBan } from '../../bitrix/bitrix.queries.mjs';
// import {createBoltDriverToBank} from '../../bitrix';
export const sentFirstDriverLetterToBolt = async (req, res) => {
  try {
    const {
      phone: req_phone,
      bolt_id: req_bolt_id,
      city_id,
      bitrix_deal_id,
    } = req.query;
    console.log({ message: 'POST: verify', query: req.query });
    const verificatedPhone = handleDriverPhone({ phone: req_phone });
    const updatePayload = { bitrix_deal_id };

    if (verificatedPhone.code === 400) {
      throw verificatedPhone;
    }
    const { phoneReadyToQuery } = verificatedPhone;
    const { rows } = await getAllBoltIdsByDriverPhone({
      phone: phoneReadyToQuery,
      bolt_id: req_bolt_id,
    });
    if (!rows || rows.length === 0) {
      throw {
        code: 400,
        status: 'error',
        message: 'Bolt ID not found',
      };
    }
    const [driver] = rows;
    const { driver_id, auto_park_id, external_id: bolt_id, phone } = driver;
    const { checkResult, actualCityId } = await checkIfDriverStaysInTheSameCity(
      {
        driver_id,
        auto_park_id,
        city_id,
      }
    );
    if (!checkResult) {
      updatePayload.city_id = actualCityId;
    }
    if (bolt_id !== req_bolt_id) {
      updatePayload.bolt_id = bolt_id;
    }
    console.log('inserting....', {
      driver_id,
      phone,
      bitrix_deal_id,
      bolt_id,
    });
    await createBoltDriverToBan({
      driver_id,
      phone,
      bitrix_deal_id,
      bolt_id,
    });

    res.status(200).json({
      status: 'ok',
      data: {
        driver_id,

        checkResult,
        phone: phoneReadyToQuery,
        bolt_id,
        updatePayload,
        // rows,
      },
    });
  } catch (error) {
    const { code, status, ...err } = error;
    if (!code) {
      throw error;
    }
    res.status(code).json({
      status,
      err,
    });
  }
};
