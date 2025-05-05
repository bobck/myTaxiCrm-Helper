import { verifyIfBoltIdCorrect } from '../../web.api/web.api.utlites.mjs';

export const boltIdVerificationHandler = async (req, res) => {
  const { driver_id, phone, bolt_id } = req.query;
  console.log({ message: 'POST: verify', query: req.query });
  const filteredPhone = String(phone).replaceAll(/[^0-9]/g, '');
  const isUkrainianPhone = filteredPhone.startsWith('380');
  const isPolishPhone = filteredPhone.startsWith('48');
  let handledPhone;
  if (isUkrainianPhone) {
    handledPhone = filteredPhone.slice(3);
  } else if (isPolishPhone) {
    handledPhone = filteredPhone.slice(2);
  } else {
    res.status(400).json({
      status: 'error',
      error: {
        message: 'Phone number is not valid. It should be Ukrainian or Polish',
        phone,
      },
    });
  }
  if (handledPhone.length !== 9) {
    res.status(400).json({
      status: 'error',
      error: {
        message: 'Phone number length is not valid.',
        phone,
      },
    });
  }
  const phoneReadyToQuery = `%${handledPhone}%`;
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
};
