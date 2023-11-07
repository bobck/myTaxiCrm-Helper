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
    { idLabels, ids },
    _page = 1,
    _orders = []
) {

    let idLabelsUrl = ''
    if (idLabels) {
        for (let idLabel of idLabels) {
            idLabelsUrl += `&id_labels[]=${idLabel}`
        }
    }
    let idUrl = ''

    if (ids) {
        for (let id of ids) {
            idUrl += `&ids[]=${id}`
        }
    }


    const response = await fetch(`${process.env.REMONLINE_API}/order/?token=${process.env.REMONLINE_API_TOKEN}&page=${_page}${idLabelsUrl}${idUrl}`);

    if (response.status == 414) {
        throw await response.text()
    }

    const data = await response.json();
    const { success } = data
    if (!success) {
        const { message, code } = data
        const { validation } = message

        if (response.status == 403 && code == 101) {
            console.info({ function: 'getOrders', message: 'Get new Auth' })
            await remonlineTokenToEnv(true);
            return await getOrders({ idLabels, ids }, _page, _orders);
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
        return await getOrders({ idLabels, ids }, parseInt(page) + 1, _orders);
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