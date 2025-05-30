import { getAllBoltIdsByDriverPhone } from '../../../web.api/web.api.utlites.mjs';

export const getDrivers = async ({ phone, bolt_id }) => {
  const { rows } = await getAllBoltIdsByDriverPhone({
    phone,
    bolt_id,
  });

  if (!rows || rows.length === 0) {
    throw {
      code: BAD_REQUEST,
      message: "Any bolt ID wasn't found",
    };
  }
  return { drivers: rows };
};
