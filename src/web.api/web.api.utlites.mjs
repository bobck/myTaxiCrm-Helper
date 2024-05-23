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
            const [firstError] = error
            const { message } = firstError || {}
            if (message == 'Cashbox balance after transaction become negative') {
                throw new Error(message);
            }

            console.error(`Attempt ${retryCount + 1} failed. Retrying in ${retryDelay}ms.`);

            if (retryCount < (maxRetries - 1)) {
                await setTimeout(retryDelay);
                retryDelay *= 2;
            } else {
                console.error({ error });
                throw new Error('Max retries reached. Unable to complete the request.');
            }
        }
    }
}

// export const makeCRMRequestlimited = globalLimiter.wrap(makeCRMRequest);
export const makeCRMRequestlimited = globalLimiter.wrap(makeCRMRequestWithRetry);


const discountByDay = {
    'Tuesday': 0.833,
    'Wednesday': 0.667,
    'Thursday': 0.5,
    'Friday': 0.333
}

export async function getDriversCandidatsForCustomTerms({ isoDate, companyId, autoParksIds }) {
    console.log({ isoDate })

    const sql = fs.readFileSync('./src/sql/drivers_for_custom_terms.sql').toString();

    const result = await pool.query(sql, [isoDate, companyId, autoParksIds])
    const { rows, rowCount } = result
    return { driversCandidatsForCustomTerms: rows }
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

        const autoparkRows = rows.filter(r => r.auto_park_id == autoParkId).reverse();
        const [firstRow] = autoparkRows
        const { name, tax_percent, tax_type, target_marker, accounting } = firstRow

        discountTariffsForAutoparks[autoParkId].name = name
        discountTariffsForAutoparks[autoParkId].taxPercent = tax_percent
        discountTariffsForAutoparks[autoParkId].taxType = tax_type
        discountTariffsForAutoparks[autoParkId].targetMarker = target_marker
        discountTariffsForAutoparks[autoParkId].accounting = accounting

        discountTariffsForAutoparks[autoParkId].tariffRules = []

        let prevTo = null;
        for (let row of autoparkRows) {

            const rule = {}

            if (row.from != 0) {
                rule.from = Math.round(row.from * discount)
            }

            if (prevTo) {
                rule.to = prevTo
                prevTo = null;
            }

            prevTo = rule.from - 1

            rule.rate = row.rate
            rule.isRateInPercent = true;

            discountTariffsForAutoparks[autoParkId].tariffRules.unshift(rule)
        }
        prevTo = null;
    }

    return { discountTariffsForAutoparks };
}

async function getOriginalBonuses({ companyId, autoParksIds }) {
    const sql = fs.readFileSync('./src/sql/bonuses_to_be_discounted.sql').toString();

    const result = await pool.query(sql, [companyId, autoParksIds])
    const { rows, rowCount } = result
    return { rows }
}

export async function getDiscountBonusesByAutoparksAndIntegrationsByDay({ dayOfWeek, companyId, autoParksIds }) {
    const discount = discountByDay[dayOfWeek]
    console.log({ dayOfWeek, discount })

    let { rows } = await getOriginalBonuses({ companyId, autoParksIds });
    const discountBonusesByAutoparksAndIntegrations = []
    for (let bonuseRuleCard of rows) {
        const createDriverBonusRulesInput = {}
        const { auto_park_id, avg_check_rules, integration_ids, trips_rules } = bonuseRuleCard

        createDriverBonusRulesInput.autoParkId = auto_park_id
        createDriverBonusRulesInput.bonusRules = {}
        createDriverBonusRulesInput.bonusRules.integrationIds = integration_ids

        createDriverBonusRulesInput.bonusRules.avgCheckRules = []

        for (let avg_check_rule of avg_check_rules) {
            createDriverBonusRulesInput.bonusRules.avgCheckRules.push(avg_check_rule);
        }

        createDriverBonusRulesInput.bonusRules.tripsRules = []

        let prevTo = null;
        for (let row of trips_rules.reverse()) {

            const rule = {}

            if (row.from != 0) {
                rule.from = Math.round(row.from * discount)
            }

            if (prevTo) {
                rule.to = prevTo
                prevTo = null;
            }

            prevTo = rule.from - 1

            rule.bonusValues = row.bonusValues

            createDriverBonusRulesInput.bonusRules.tripsRules.unshift(rule)
        }


        discountBonusesByAutoparksAndIntegrations.push(createDriverBonusRulesInput)
    }

    return { discountBonusesByAutoparksAndIntegrations }
}

export async function createCashlessPaymentApplication({ type, autoParkId, cashboxId, expenseType, carId, sum, contractorId, payByDate, comment }) {

    const body = {
        operationName: "CreateCashlessPaymentApplication",
        variables: {
            createCashlessPaymentApplicationInput: {
                type,
                autoParkId,
                cashboxId,
                expenseType,
                sum,
                carId,
                contractorId,
                payByDate,
                comment
            }
        },
        query: "mutation CreateCashlessPaymentApplication($createCashlessPaymentApplicationInput: CreateCashlessPaymentApplicationInput!) {\n  createCashlessPaymentApplication(\n    createCashlessPaymentApplicationInput: $createCashlessPaymentApplicationInput\n  ) {\n    id\n    __typename\n  }\n}\n"
    }
    const { data } = await makeCRMRequestlimited({ body });
    const { createCashlessPaymentApplication: cashlessPaymentApplication } = data
    return { cashlessPaymentApplication }
}

export async function editCashlessPaymentApplication({ applicationId, status }) {
    const body = {
        operationName: "EditCashlessPaymentApplication",
        variables: {
            editCashlessPaymentApplicationInput: {
                applicationId,
                status
            }
        },
        query: "mutation EditCashlessPaymentApplication($editCashlessPaymentApplicationInput: EditCashlessPaymentApplicationInput!) {\n  editCashlessPaymentApplication(\n    editCashlessPaymentApplicationInput: $editCashlessPaymentApplicationInput\n  ) {\n    status\n    __typename\n  }\n}\n"
    }
    const { data } = await makeCRMRequestlimited({ body });
    const { editCashlessPaymentApplication: cashlessPaymentApplication } = data
    return { cashlessPaymentApplication }
}

export async function payApplication({ applicationId, autoParkId }) {
    const body = {
        operationName: "PayApplication",
        variables: {
            payApplicationInput: {
                applicationId,
                autoParkId
            }
        },
        query: "mutation PayApplication($payApplicationInput: PayApplicationInput!) {\n  payApplication(payApplicationInput: $payApplicationInput) {\n    success\n    __typename\n  }\n}\n"
    }
    const { data } = await makeCRMRequestlimited({ body });
    const { payApplication } = data
    return { payApplication }
}


export const repairExpensesTypes = {
    "0.1": "CALCULATED_STATEMENT_CORRECTION",
    "2.1": "GASOLINE",
    "2.13": "CAR_WASH",
    "2.2": "GAS",
    "2.21": "DIESEL_FUEL",
    "2.4": "SPARE_PARTS_BY_URGENT_REPAIR",
    "2.41": "SPARE_PARTS_BY_WAREHOUSE",
    "2.5": "SPARE_PARTS_BY_ROAD_ACCIDENT",
    "2.52": "REPAIR_WORK",
    "2.532": "TIRE_BYING",
    "2.54": "MAINTENANCE_STATION_SUPPLIES",
    "2.55": "MAINTENANCE_STATION_EQUIPMENT",
    "2.56": "MAINTENANCE_STATION_SERVICES",
    "2.8": "TOP_UP_TELEPHONE_BALANCE",
    "2.9": "PURCHASE_SUPPLIES",
    "3.2": "SALARY_OR_ADVANCE_OFFICE",
    "3.209": "SALARY_OR_ADVANCE_OFFICE_CENTRAL",
    "3.5": "TRAVEL_COSTS_OFFICE",
    "3.6": "HOSPITALITY",
    "3.91": "KPI_BONUSES",
    "3.919": "WORK_BONUS_OFFICE_CENTRAL",
    "3.92": "WORK_BONUS_OFFICE",
    "4.1": "ROOM_RENTAL",
    "4.2": "UTILITY_BILLS",
    "4.21": "UTILITY_BILLS_METERS",
    "4.3": "STATIONARY",
    "4.4": "HOUSEHOLD_GOODS",
    "4.41": "DOCUMENT_FLOW",
    "4.42": "DELIVERY",
    "4.5": "CATERING_OFFICE",
    "4.6": "OFFICE_TRANSPORTATION",
    "4.7": "ADVERTISING",
    "4.8": "REPAIR_OFFICE",
    "4.809": "REPAIR_OFFICE_CENTRAL",
    "4.9": "EQUIPMENT_OFFICE",
    "5.3": "BANK_COMMISSION",
    "5.4": "SIDE_CAR_RENTAL",
    "8.1": "TAXES"
}