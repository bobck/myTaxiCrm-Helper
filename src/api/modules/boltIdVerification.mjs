import { verifyIfBoltIdCorrect } from '../../web.api/web.api.utlites.mjs';
import {
  handleDriverPhone,
  checkIfDriverStaysInTheSameCity,
} from '../endpoints-utils.mjs';
export const boltIdVerificationHandler = async (req, res) => {
  try {
    const { driver_id, phone, bolt_id, city_id } = req.query;
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

    console.log({ rows });
    res.status(200).json({
      status: 'ok',
      s: {
        driver_id,
        phone: handledPhone,
        isUkrainianPhone,
        isPolishPhone,
        rows,
      },
    });
  } catch (error) {
    const { code, status, ...err } = error;
    res.status(code).json({
      status,
      err,
    });
  }
};
