import fetch from 'node-fetch';
import fs from 'fs'
import { setTimeout } from 'timers/promises';
import { pool } from './../api/pool.mjs'
import { globalLimiter } from './bottleneck.mjs';

async function makeCRMRequest({ body }) {
    const response = await fetch(process.env.WEB_API_ENDPOINT, {
        headers: {
            "content-type": "application/json",
            authorization: process.env.WEB_API_AUTH,
        },
        method: "POST",
        body: JSON.stringify(body)
    });

    const json = await response.json();

    const { errors, data } = json;

    if (errors) {
        throw errors
    }

    return json;
}

async function makeCRMRequestWithRetry({ body }) {
    let retryDelay = 600;
    const maxRetries = 5;

    for (let retryCount = 0; retryCount < maxRetries; retryCount++) {
        try {
            const response = await fetch(process.env.WEB_API_ENDPOINT, {
                headers: {
                    "content-type": "application/json",
                    authorization: process.env.WEB_API_AUTH,
                },
                method: "POST",
                body: JSON.stringify(body)
            });

            const json = await response.json();

            const { errors, data } = json;

            if (errors) {
                throw errors
            }

            return json;
        } catch (error) {
            console.error(`Attempt ${retryCount + 1} failed. Retrying in ${retryDelay}ms. Error: ${JSON.stringify(error)}`);

            if (retryCount < (maxRetries - 1)) {
                await setTimeout(retryDelay);
                retryDelay *= 2;
            } else {
                throw new Error('Max retries reached. Unable to complete the request.');
            }
        }
    }
}

export const makeCRMRequestlimited = globalLimiter.wrap(makeCRMRequest);
// export const makeCRMRequestlimited = globalLimiter.wrap(makeCRMRequestWithRetry);


const discountByDay = {
    'Tuesday': 0.833,
    'Wednesday': 0.667,
    'Thursday': 0.5,
    'Friday': 0.333
}

export async function getDriversForCustomTerms({ isoDate, companyId, autoParksIds }) {
    console.log({ isoDate })

    const sql = fs.readFileSync('./src/sql/drivers_for_custom_terms.sql').toString();

    const result = await pool.query(sql, [isoDate, companyId, autoParksIds])
    const { rows, rowCount } = result
    return { driversForCustomTerms: rows }
}

async function getOriginalTariffs({ companyId, autoParksIds }) {
    const sql = fs.readFileSync('./src/sql/tariffs_to_be_discounted.sql').toString();

    const result = await pool.query(sql, [companyId, autoParksIds])
    const { rows, rowCount } = result
    return { rows }
}

export async function getDiscountTariffsForAutoparksByDay({ dayOfWeek, companyId, autoParksIds }) {
    const discount = discountByDay[dayOfWeek]
    console.log({ dayOfWeek, discount })

    let { rows } = await getOriginalTariffs({ companyId, autoParksIds });

    const uniqueAutoParkIds = [];

    rows.forEach(row => {
        const autoParkId = row.auto_park_id;

        if (!uniqueAutoParkIds.includes(autoParkId)) {
            uniqueAutoParkIds.push(autoParkId);
        }
    });

    const discountTariffsForAutoparks = {}

    for (let autoParkId of uniqueAutoParkIds) {
        discountTariffsForAutoparks[autoParkId] = {}

        const autoparkRows = rows.filter(r => r.auto_park_id == autoParkId)
        const [firstRow] = autoparkRows
        const { name, tax_percent, tax_type, target_marker, accounting } = firstRow

        discountTariffsForAutoparks[autoParkId].name = name
        discountTariffsForAutoparks[autoParkId].taxPercent = tax_percent
        discountTariffsForAutoparks[autoParkId].taxType = tax_type
        discountTariffsForAutoparks[autoParkId].targetMarker = target_marker
        discountTariffsForAutoparks[autoParkId].accounting = accounting

        discountTariffsForAutoparks[autoParkId].tariffRules = []

        let nextFrom = null;
        for (let row of autoparkRows) {

            const rule = {}
            if (nextFrom) {
                rule.from = nextFrom
                nextFrom = null;
            }

            if (row.to !== 1000000) {
                rule.to = Math.round(row.to * discount)
                nextFrom = rule.to + 1
            }
            rule.rate = row.rate
            rule.isRateInPercent = true;

            discountTariffsForAutoparks[autoParkId].tariffRules.push(rule)
        }
        nextFrom = null;
    }

    return { discountTariffsForAutoparks };
}