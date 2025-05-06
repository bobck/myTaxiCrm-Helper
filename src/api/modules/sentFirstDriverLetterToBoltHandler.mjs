import { verifyIfBoltIdCorrect } from '../../web.api/web.api.utlites.mjs';
import {
  handleDriverPhone,
  checkIfDriverStaysInTheSameCity,
} from '../endpoints-utils.mjs';
export const sentFirstDriverLetterToBolt = async (req, res) => {
  try {
    const { phone, bolt_id, city_id, bitrix_card_id } = req.query;
    console.log({ message: 'POST: verify', query: req.query });
    const verificatedPhone = handleDriverPhone({ phone });

    if (verificatedPhone.code === 400) {
      throw verificatedPhone;
    }
    const { phoneReadyToQuery } = verificatedPhone;
    const { rows } = await verifyIfBoltIdCorrect({
      phone: phoneReadyToQuery,
      bolt_id,
    });
    if (!rows || rows.length === 0) {
      throw {
        code: 400,
        status: 'error',
        message: 'Bolt ID not found',
      };
    }
    const { driver_id, auto_park_id } = rows[0];
    const { checkResult } = await checkIfDriverStaysInTheSameCity({
      driver_id,
      auto_park_id,
      city_id,
    });

    console.log(checkResult);

    // console.log({ rows });
    res.status(200).json({
      status: 'ok',
      data: {
        driver_id,
        checkResult,
        phone: phoneReadyToQuery,
        rows,
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
