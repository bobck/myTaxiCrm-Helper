import fetch from 'node-fetch';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { remonlineTokenToEnv } from './remonline.api.mjs';
import * as Stream from 'node:stream';

const db = await open({
  filename: process.env.DEV_DB,
  driver: sqlite3.Database,
});

export async function saveSidRow({
  id,
  auto_park_id,
  created_at,
  purpose,
  comment,
  sid_lable,
}) {
  const result = await db.run(
    'INSERT INTO sids(id,auto_park_id,created_at,purpose,comment,sid_lable) VALUES (:id,:auto_park_id,:created_at,:purpose,:comment,:sid_lable)',
    {
      ':id': id,
      ':auto_park_id': auto_park_id,
      ':created_at': created_at,
      ':purpose': purpose,
      ':comment': comment,
      ':sid_lable': sid_lable,
    }
  );
  return { result };
}

export async function getOrdersByIdLabels(
  { idLabels, ids },
  _page = 1,
  _orders = []
) {
  let idLabelsUrl = '';
  if (idLabels) {
    for (let idLabel of idLabels) {
      idLabelsUrl += `&id_labels[]=${idLabel}`;
    }
  }
  let idUrl = '';

  if (ids) {
    for (let id of ids) {
      idUrl += `&ids[]=${id}`;
    }
  }

  const response = await fetch(
    `${process.env.REMONLINE_API}/order/?token=${process.env.REMONLINE_API_TOKEN}&page=${_page}${idLabelsUrl}${idUrl}`
  );

  if (
    response.status == 414 ||
    response.status == 503 ||
    response.status == 502 ||
    response.status == 504
  ) {
    throw await response.text();
  }

  if (process.env.LOG == 'LOG') {
    console.log(await response.text());
  }

  const data = await response.json();
  const { success } = data;
  if (!success) {
    const { message, code } = data;
    const { validation } = message;

    if (response.status == 403 && code == 101) {
      console.info({ function: 'getOrders', message: 'Get new Auth' });
      await remonlineTokenToEnv(true);
      return await getOrdersByIdLabels({ idLabels, ids }, _page, _orders);
    }

    console.error({
      function: 'getOrdersByIdLabels',
      message,
      validation,
      status: response.status,
    });
    return;
  }

  const { data: orders, count, page } = data;

  const doneOnPrevPage = (page - 1) * 50;

  const leftTofinish = count - doneOnPrevPage - orders.length;

  _orders.push(...orders);

  // console.log({ count, page, doneOnPrevPage, leftTofinish })

  if (leftTofinish > 0) {
    return await getOrdersByIdLabels(
      { idLabels, ids },
      parseInt(page) + 1,
      _orders
    );
  }

  return { orders: _orders };
}

export async function changeOrderStatus({ id, statusId }) {
  const params = new URLSearchParams();

  params.append('token', process.env.REMONLINE_API_TOKEN);
  params.append('status_id', statusId);
  params.append('order_id', id);

  const response = await fetch(`${process.env.REMONLINE_API}/order/status/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  const data = await response.json();
  const { success } = data;
  if (!success) {
    const { message, code } = data;
    const { validation } = message;

    if (response.status == 403 && code == 101) {
      console.info({ function: 'createOrder', message: 'Get new Auth' });
      await remonlineTokenToEnv(true);
      return await changeOrderStatus({ id, statusId });
    }

    console.error({
      function: 'changeOrderStatus',
      message,
      validation,
      status: response.status,
    });
    return;
  }

  const { data: changeOrderStatusData } = data;
  return { changeOrderStatusData };
}

export async function getCashboxTransactions(
  { createdAt, cashboxId },
  _page = 1,
  _transactions = []
) {
  let createdAtUrl = '';
  if (createdAt) {
    createdAtUrl += `&created_at[]=${createdAt}`;
  }

  const response = await fetch(
    `${process.env.REMONLINE_API}/cashbox/report/${cashboxId}?token=${process.env.REMONLINE_API_TOKEN}&page=${_page}${createdAtUrl}&sort_dir=asc`
  );

  if (
    response.status == 414 ||
    response.status == 503 ||
    response.status == 502 ||
    response.status == 504
  ) {
    throw await response.text();
  }

  if (response.status == 403) {
    console.info({
      function: 'getCashboxTransactions',
      message: 'Get new Auth',
    });
    await remonlineTokenToEnv(true);
    return await getCashboxTransactions(
      { createdAt, cashboxId },
      _page,
      _transactions
    );
  }

  try {
    const data = await response.json();
    const { success } = data;

    if (!success) {
      const { message, code } = data;
      const { validation } = message;

      console.error({
        function: 'getCashboxTransactions',
        message,
        validation,
        response_status: response.status,
      });
      throw validation;
    }

    const { data: transactions, count, page } = data;

    const doneOnPrevPage = (page - 1) * 50;

    const leftTofinish = count - doneOnPrevPage - transactions.length;

    _transactions.push(...transactions);

    if (leftTofinish > 0) {
      return await getCashboxTransactions(
        { createdAt, cashboxId },
        parseInt(page) + 1,
        _transactions
      );
    }

    return { transactions: _transactions };
  } catch (e) {
    console.error({
      function: 'getCashboxTransactions',
      e: e?.message,
      response_status: response.status,
    });
    throw response.status;
  }
}
export async function getLocations() {
  // return await fetch(`${process.env.REMONLINE_API}/branches/?token=${process.env.REMONLINE_API_TOKEN}`);
  const url = `${process.env.REMONLINE_API}/branches/?token=${process.env.REMONLINE_API_TOKEN}`;
  const options = { method: 'GET', headers: { accept: 'application/json' } };

  const response = await fetch(url, options);
  const { data } = await response.json();
  return data;
}

export async function getTransfers({ branch_id }, _page = 1, _transfers = []) {
  const url = `${process.env.REMONLINE_API}/warehouse/moves/?page=${_page}&branch_id=${branch_id}&token=${process.env.REMONLINE_API_TOKEN}`;

  const options = { method: 'GET', headers: { accept: 'application/json' } };

  const response = await fetch(url, options);

  const data = await response.json();
  const { success } = data;
  if (!success) {
    const { message, code } = data;
    const { validation } = message;
    if (response.status == 403 && code == 101) {
      console.info({ function: 'getTransfers', message: 'Get new Auth' });
      await remonlineTokenToEnv(true);
      return await getTransfers({ branch_id }, _page, _transfers);
    }
    console.error({
      function: 'getTransfers',
      message,
      validation,
      status: response.status,
    });
    return;
  }
  const { data: transfers, page, count } = data;
  const doneOnPrevPage = (page - 1) * 50;

  const leftToFinish = count - doneOnPrevPage - transfers.length;

  _transfers.push(
    ...transfers.map((transfer) => {
      return { branch_id, ...transfer };
    })
  );

  // console.log({ count, page, doneOnPrevPage, leftToFinish })

  if (leftToFinish > 0) {
    return await getTransfers({ branch_id }, parseInt(page) + 1, _transfers);
  }
  return { transfers: _transfers };
}

export async function getOrders(
  { current_page, _orders, target_page, _failedPages } = {
    current_page: 1,
    _orders: [],
    _failedPages: [],
  }
) {
  if (!target_page || !current_page) {
    console.error({
      function: 'getOrders',
      message: 'target_page or current_page is not defined',
    });
  }
  if (!_orders) {
    _orders = [];
  }
  if (!_failedPages) {
    _failedPages = [];
  }
  const url = `${process.env.REMONLINE_API}/order/?page=${current_page}&token=${process.env.REMONLINE_API_TOKEN}`;

  const options = { method: 'GET', headers: { accept: 'application/json' } };

  const response = await fetch(url, options);
  let data;
  try {
    data = await response.json();
  } catch (e) {
    console.error({
      function: 'getOrders',
      page: current_page,
      message: 'Error parsing JSON',
      data,
      ordersCount: _orders.length,
      response,
      target_page,
    });
    for (let i = current_page; i <= target_page; i++) {
      _failedPages.push(i);
    }
    return { orders: _orders, failedPages: _failedPages };
    // throw e;
  }

  const { success } = data;
  if (!success) {
    const { message, code } = data;
    const { validation } = message;
    if (response.status == 403 && code == 101) {
      console.info({ function: 'getOrders', message: 'Get new Auth' });
      await remonlineTokenToEnv(true);
      return await getOrders({ current_page, _orders, target_page });
    }
    console.error({
      function: 'getOrders',
      message,
      validation,
      status: response.status,
    });
    return;
  }
  const { data: orders, page, count } = data;

  _orders.push(...orders.map((order) => structuredClone(order)));

  // console.log({ count, page, doneOnPrevPage, leftToFinish })
  // if (process.env.ENV === 'TEST') {
  //   console.log({ current_page, target_page });
  // }

  if (page === target_page) {
    console.log({
      target_page,
      start_page: target_page - 5,
      fetched_orders: _orders.length,
    });
    return { orders: _orders, failedPages: _failedPages };
  } else {
    return await getOrders({
      current_page: parseInt(page) + 1,
      _orders,
      target_page,
    });
  }
}
export async function getOrdersByPageIds({pages}){
  if(!(pages instanceof Array)) {
    console.error({
      function: 'getOrdersByPageIds',
      message: 'pages must be an array',
      pages
    })
  }

  const  _orders = [];


  const  _failedPages = [];
  for (const page of pages) {
    const url = `${process.env.REMONLINE_API}/order/?page=${page}&token=${process.env.REMONLINE_API_TOKEN}`;

    const options = { method: 'GET', headers: { accept: 'application/json' } };

    const response = await fetch(url, options);
    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error({
        function: 'getOrders',
        page,
        message: 'Error parsing JSON',
        data,
        ordersCount: _orders.length,
        response,
      });

        _failedPages.push(page);

      return { orders: _orders, failedPages: _failedPages };
    }

    const { data: orders } = data;

    _orders.push(...structuredClone(orders));

  }


  return{
    orders:_orders.flat(),
    failedPages:_failedPages,
  }

}
export async function getOrderCount() {
  const url = `${process.env.REMONLINE_API}/order/?token=${process.env.REMONLINE_API_TOKEN}`;

  const options = { method: 'GET', headers: { accept: 'application/json' } };

  const response = await fetch(url, options);

  const data = await response.json();
  const { success } = data;
  if (!success) {
    const { message, code } = data;
    const { validation } = message;
    if (response.status == 403 && code == 101) {
      console.info({ function: 'getOrders', message: 'Get new Auth' });
      await remonlineTokenToEnv(true);
      return await getOrders({ current_page, _orders, target_page });
    }
    console.error({
      function: 'getTransfers',
      message,
      validation,
      status: response.status,
    });
    return;
  }
  const { count } = data;
  return { orderCount: count };
}
