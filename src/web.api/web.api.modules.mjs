import pg from 'pg';
import fs from 'fs'
import { setTimeout } from 'timers/promises';

import { makeCRMRequest } from './web.api.utlites.mjs';
const { Client } = pg;


const conString = `postgres://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}/${process.env.PG_DB}`;

async function getAndFireDrivers() {
    const client = new Client(conString);
    const connect = await client.connect();

    console.log({ time: new Date(), message: 'getAndFireDrivers', connect })

    const sql = fs.readFileSync('./src/sql/drivers_with_no_status.sql').toString();

    const result = await client.query(sql)
    const { rows, rowCount } = result
    console.log({ rowCount })

    let errorsCount = 0
    let doneCount = 0
    let lastError = ''
    for (let driver of rows) {

        const { auto_park_id, id } = driver
        await setTimeout(500);

        const body = {
            operationName: "FireOutDriver",
            variables: {
                fireOutDriverInput: {
                    driverId: id,
                    autoParkId: auto_park_id,
                    status: "BACK_TO_MAIN_JOB",
                    eventTime: "2023-08-30T23:59:59.999Z",
                    comment: "Перенесення з гугл каси"
                }
            },
            query: `mutation FireOutDriver($fireOutDriverInput: FireOutDriverInput!) {
                  fireOutDriver(fireOutDriverInput: $fireOutDriverInput) {
                        success
                        __typename
                          }
                        }`
        }

        try {
            const response = await makeCRMRequest({ body });

            const { errors, data } = response
            if (errors) {
                lastError = errors
                errorsCount++
            }
            if (data) {
                doneCount++
            }
            console.log({
                lastError,
                driverId,
                autoParkId,
                errorsCount,
                doneCount,
                total: `${errorsCount + doneCount}/${rowCount}`
            })
        } catch (e) {
            console.log({ text: 'skip cause error', auto_park_id, id })
        }

    }

    await client.end()
    return
}

if (process.env.ENV == "TEST") {
    getAndFireDrivers();
}