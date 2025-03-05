import fetch from 'node-fetch';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite'
import { remonlineTokenToEnv } from './remonline.api.mjs';

const db = await open({
    filename: process.env.DEV_DB,
    driver: sqlite3.Database
})

export async function saveSidRow({ id,
    auto_park_id,
    created_at,
    purpose,
    comment,
    sid_lable
}) {
    const result = await db.run('INSERT INTO sids(id,auto_park_id,created_at,purpose,comment,sid_lable) VALUES (:id,:auto_park_id,:created_at,:purpose,:comment,:sid_lable)',
        {
            ':id': id,
            ':auto_park_id': auto_park_id,
            ':created_at': created_at,
            ':purpose': purpose,
            ':comment': comment,
            ':sid_lable': sid_lable
        })
    return { result }
}

export async function getOrders(
    filters = {},
    _page = 1,
    _orders = []
) {
    const { idLabels = [], ids = [], statuses = [] } = filters;

    // Build query parameters
    const idLabelsQuery = idLabels.map(label => `id_labels[]=${encodeURIComponent(label)}`).join('&');
    const idsQuery = ids.map(id => `ids[]=${encodeURIComponent(id)}`).join('&');
    const statusesQuery = statuses.map(statuses => `statuses[]=${encodeURIComponent(statuses)}`).join('&');
    const queryParams = [`page=${_page}`, idLabelsQuery, idsQuery, statusesQuery].filter(Boolean).join('&');
    const apiUrl = `${process.env.REMONLINE_API}/order/?token=${process.env.REMONLINE_API_TOKEN}&${queryParams}`;

    const response = await fetch(apiUrl);

    if ([414, 503, 502, 504].includes(response.status)) {
        throw await response.text()
    }

    if (process.env.LOG == "LOG") {
        console.log(await response.text())
    }

    const data = await response.json();
    const { success } = data
    if (!success) {
        const { message, code } = data
        const { validation } = message

        if (response.status == 403 && code == 101) {
            console.info({ function: 'getOrders', message: 'Get new Auth' })
            await remonlineTokenToEnv(true);
            return await getOrders(filters, _page, _orders);
        }

        console.error({ function: 'getOrders', message, validation, status: response.status })
        return
    }

    const { data: orders, count, page } = data

    const doneOnPrevPage = (page - 1) * 50;

    const leftTofinish = (count - doneOnPrevPage) - orders.length;

    _orders.push(...orders);

    // console.log({ count, page, doneOnPrevPage, leftTofinish })

    if (leftTofinish > 0) {
        return await getOrders(filters, parseInt(page) + 1, _orders);
    }

    return { orders: _orders }
}

export async function changeOrderStatus({
    id, statusId
}) {

    const params = new URLSearchParams();

    params.append('token', process.env.REMONLINE_API_TOKEN);
    params.append('status_id', statusId);
    params.append('order_id', id);


    const response = await fetch(`${process.env.REMONLINE_API}/order/status/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });


    const data = await response.json();
    const { success } = data
    if (!success) {
        const { message, code } = data
        const { validation } = message

        if (response.status == 403 && code == 101) {
            console.info({ function: 'createOrder', message: 'Get new Auth' })
            await remonlineTokenToEnv(true);
            return await changeOrderStatus({ id, statusId });
        }

        console.error({ function: 'changeOrderStatus', message, validation, status: response.status })
        return
    }

    const { data: changeOrderStatusData } = data
    return { changeOrderStatusData };
}

export async function getCashboxTransactions(
    { createdAt, cashboxId },
    _page = 1,
    _transactions = []
) {
    let createdAtUrl = ''
    if (createdAt) {
        createdAtUrl += `&created_at[]=${createdAt}`
    }

    const response = await fetch(`${process.env.REMONLINE_API}/cashbox/report/${cashboxId}?token=${process.env.REMONLINE_API_TOKEN}&page=${_page}${createdAtUrl}&sort_dir=asc`);

    if (response.status == 414 || response.status == 503 || response.status == 502 || response.status == 504) {
        throw await response.text()
    }

    if (response.status == 403) {
        console.info({ function: 'getCashboxTransactions', message: 'Get new Auth' })
        await remonlineTokenToEnv(true);
        return await getCashboxTransactions({ createdAt, cashboxId }, _page, _transactions);
    }

    try {
        const data = await response.json();
        const { success } = data

        if (!success) {
            const { message, code } = data
            const { validation } = message

            console.error({ function: 'getCashboxTransactions', message, validation, response_status: response.status })
            throw validation
        }

        const { data: transactions, count, page } = data

        const doneOnPrevPage = (page - 1) * 50;

        const leftTofinish = (count - doneOnPrevPage) - transactions.length;

        _transactions.push(...transactions);

        if (leftTofinish > 0) {
            return await getCashboxTransactions({ createdAt, cashboxId }, parseInt(page) + 1, _transactions);
        }

        return { transactions: _transactions }
    } catch (e) {
        console.error({ function: 'getCashboxTransactions', e: e?.message, response_status: response.status })
        throw response.status;
    }

}