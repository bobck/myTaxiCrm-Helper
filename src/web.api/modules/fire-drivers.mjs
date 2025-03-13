import fs from 'fs';
import { pool } from '../../api/pool.mjs';
import { makeCRMRequestlimited } from '../web.api.utlites.mjs';

async function getAndFireDrivers() {
  console.log({
    time: new Date(),
    message: 'getAndFireDrivers',
  });

  const sql = fs
    .readFileSync('./src/sql/drivers_with_no_status.sql')
    .toString();

  const result = await pool.query(sql);
  const { rows, rowCount } = result;
  console.log({ rowCount });

  let totalCount = 0;
  let errorsCount = 0;
  let doneCount = 0;
  for (let driver of rows) {
    const { auto_park_id: autoParkId, id: driverId } = driver;
    console.log({
      autoParkId,
      driverId,
    });

    const body = {
      operationName: 'FireOutDriver',
      variables: {
        fireOutDriverInput: {
          driverId,
          // autoParkId,
          status: 'BACK_TO_MAIN_JOB',
          eventTime: '2023-08-30T23:59:59.999Z',
          comment: 'Перенесення з гугл каси',
        },
      },
      query: `mutation FireOutDriver($fireOutDriverInput: FireOutDriverInput!) {
                  fireOutDriver(fireOutDriverInput: $fireOutDriverInput) {
                        success
                        __typename
                          }
                        }`,
    };

    try {
      totalCount++;
      console.log({ totalCount });
      const response = await makeCRMRequestlimited({
        body,
      });

      const { errors, data } = response;

      if (data) {
        doneCount++;
      }

      console.log({
        driverId,
        autoParkId,
        errorsCount,
        doneCount,
        total: `${errorsCount + doneCount}/${rowCount}`,
      });
    } catch (errors) {
      errorsCount++;
      console.log({
        text: 'skip cause error',
        autoParkId,
        driverId,
      });
      console.error({ errors });
    }
  }
  return;
}

if (process.env.ENV == 'TEST') {
  getAndFireDrivers();
}
