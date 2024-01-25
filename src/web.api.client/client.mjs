import fetch from 'node-fetch';
import pg from 'pg';
import fs from 'fs'

const { Client } = pg;

import { setTimeout } from 'timers/promises';


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
        const { auto_park_id: autoParkId, id: driverId } = driver
        await setTimeout(500); // Ожидание 2 секунды
        const response = await fireOutDriver({
            driverId,
            autoParkId
        });
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
    }

    await client.end()
    return
}

async function fireOutDriver({ driverId, autoParkId }) {
    const body = {
        operationName: "FireOutDriver",
        variables: {
            fireOutDriverInput: {
                driverId,
                autoParkId,
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
    const response = await fetch(process.env.WEB_API_ENDPOINT, {
        headers: {
            "content-type": "application/json",
            authorization: process.env.WEB_API_AUTH,
        },
        method: "POST",
        body: JSON.stringify(body)
    });
    return response.json();
}

if (process.env.ENV == "TEST") {
    getAndFireDrivers();
}