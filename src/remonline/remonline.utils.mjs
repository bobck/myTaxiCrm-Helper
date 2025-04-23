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

export async function getOrdersInRange(
  { current_page, modified_at, _orders, target_page, _failedPages } = {
    modified_at: 0,
    current_page: 1,
    _orders: [],
    _failedPages: [],
  }
) {
  // console.log('calling getOrdersInRange', {
  //   current_page,
  //   _orders,
  //   target_page,
  //   _failedPages,
  // });
  if (!_orders) {
    _orders = [];
  }
  if (!_failedPages) {
    _failedPages = [];
  }
  if (!modified_at) {
    modified_at = 0;
  }

  const url = `${process.env.REMONLINE_API}/order/?sort_dir=asc&modified_at[]=${modified_at}&page=${current_page}&token=${process.env.REMONLINE_API_TOKEN}`;

  // const url = 'https://api.remonline.app/order/?page=1&sort_dir=asc&modified_at[]=1742926803000&token=2c1293a28cfefff0409a40d7f9b837df2cc7ad54';
  // const options = {method: 'GET', headers: {accept: 'application/json'}};
  // console.log(url)
  const options = { method: 'GET', headers: { accept: 'application/json' } };

  const response = await fetch(url, options);
  let data;
  try {
    data = await response.json();
  } catch (e) {
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
      // console.info({ function: 'getOrders', message: 'Get new Auth' });
      await remonlineTokenToEnv(true);
      return await getOrdersInRange({ current_page, _orders, target_page });
    }
    console.error({
      function: 'getOrdersInRange',
      message,
      validation,
      status: response.status,
    });
    return;
  }
  const { data: orders, page, count } = data;
  // console.log({ url,responseLength:orders.length });

  _orders.push(...orders.map((order) => structuredClone(order)));
  // console.log({ ordersLength: _orders.length });

  // console.log({ count, page, doneOnPrevPage, leftToFinish })
  // if (process.env.ENV === 'TEST') {
  //   console.log({ current_page, target_page });
  // }

  if (page === target_page) {
    // console.log({
    //   target_page,
    //   start_page: target_page - 5,
    //   fetched_orders: _orders.length,
    // });
    return { orders: _orders, failedPages: _failedPages };
  } else {
    return await getOrdersInRange({
      modified_at,
      current_page: parseInt(page) + 1,
      _orders,
      target_page,
    });
  }
}

export async function getOrdersByPageIds({ modified_at, _orders, pages }) {
  if (!_orders) {
    _orders = [];
  }
  if (!pages) {
    pages = [];
  }
  if (!modified_at) {
    modified_at = 0;
  }

  const current_page = pages.pop();

  const url = `${process.env.REMONLINE_API}/order/?sort_dir=asc&modified_at[]=${modified_at}&page=${current_page}&token=${process.env.REMONLINE_API_TOKEN}`;
  const options = { method: 'GET', headers: { accept: 'application/json' } };

  const response = await fetch(url, options);
  let data;
  try {
    data = await response.json();
  } catch (e) {
    console.error({ failedPage: current_page, response });
    const _failedPages = [];
    _failedPages.push(current_page, ...pages);
    return { orders: _orders, failedPages: _failedPages };
    // throw e;
  }

  const { success } = data;
  if (!success) {
    const { message, code } = data;
    const { validation } = message;
    if (response.status == 403 && code == 101) {
      // console.info({ function: 'getOrders', message: 'Get new Auth' });
      pages.push(current_page);
      await remonlineTokenToEnv(true);
      return await getOrdersByPageIds({ pages, _orders, modified_at });
    }
    console.error({
      function: 'getOrdersByPageIds',
      message,
      validation,
      status: response.status,
    });
    return;
  }
  const { data: orders, page, count } = data;
  // console.log({pushingOrders:orders.map((order) => order.id)})
  _orders.push(...orders.map((order) => structuredClone(order)));

  if (pages.length === 0) {
    return { orders: _orders, failedPages: [] };
  } else {
    return await getOrdersByPageIds({
      modified_at,
      _orders,
      pages,
    });
  }
}
export async function getOrderCount({ modified_at }) {
  console.log({ modified_at }, 'getOrderCount');
  const url = `${process.env.REMONLINE_API}/order/?sort_dir=asc&modified_at[]=${modified_at}&token=${process.env.REMONLINE_API_TOKEN}`;

  const options = { method: 'GET', headers: { accept: 'application/json' } };

  const response = await fetch(url, options);

  const data = await response.json();
  // console.log({ data });
  const { success } = data;
  if (!success) {
    const { message, code } = data;
    const { validation } = message;
    if (response.status == 403 && code == 101) {
      console.info({ function: 'getOrderCount', message: 'Get new Auth' });
      await remonlineTokenToEnv(true);
      return await getOrderCount({ current_page, _orders, target_page });
    }
    console.error({
      function: 'getOrdersCount',
      message,
      validation,
      status: response.status,
    });
    return;
  }
  const { count } = data;
  return { orderCount: count };
}
export async function getEmployees() {
  const url = `${process.env.REMONLINE_API}/employees/?token=${process.env.REMONLINE_API_TOKEN}`;
  const options = { method: 'GET', headers: { accept: 'application/json' } };
  const response = await fetch(url, options);
  let data;
  try {
    data = await response.json();
  } catch (e) {
    console.error({
      function: 'getEmpoyees',
      message: 'Error parsing JSON',
      data,
    });
  }
  const { success } = data;
  if (!success) {
    const { message, code } = data;
    const { validation } = message;
    if (response.status == 403 && code == 101) {
      console.info({ function: 'getEmployees', message: 'Get new Auth' });
      await remonlineTokenToEnv(true);
      return await getEmployees();
    }
    console.error({
      function: 'getEmployees',
      message,
      validation,
      status: response.status,
    });
    return;
  }
  const { data: employees } = data;
  // console.log(data);
  return employees;
}
export async function postMockOrder() {
  const client_id = 34268974;
  const branch_id = 112954;
  const order_type = 185289;
  const ad_campaign_id = 301120;
  const options = {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      order_type,
      branch_id,
      client_id,
      malfunction: 'someMalfunction',
      scheduled_for: 2000000000000,
      custom_fields: {
        f5294177: 'test',
        f5294178: 5.0,
      },
      ad_campaign_id,
    }),
  };

  const response = await fetch(
    `${process.env.REMONLINE_API}/order/?token=${process.env.REMONLINE_API_TOKEN}`,
    options
  );

  const data = await response.json();
  const { success } = data;
  if (!success) {
    const { message, code } = data;
    const { validation } = message;
    if (response.status == 403 && code == 101) {
      console.info({ function: 'postMockOrder', message: 'Get new Auth' });
      await remonlineTokenToEnv(true);
      return await postMockOrder({
        id,
        id_label,
        status_id,
        created_at,
        modified_at,
        auto_park_id,
      });
    }
    console.error({
      function: 'postMockOrder',
      message,
      validation,
      status: response.status,
    });
    return;
  }
  return data;
}
