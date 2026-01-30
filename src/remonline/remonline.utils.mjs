import fetch from 'node-fetch';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { remonlineTokenToEnv } from './remonline.api.mjs';

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

export async function getOrders(
  { idLabels, ids, modified_at, sort_dir },
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
  const sort_dir_url = sort_dir ? `&sort_dir=${sort_dir}` : '';
  const modified_at_url = modified_at ? `&modified_at[]=${modified_at}` : '';

  const url = `${process.env.REMONLINE_API}/order/?token=${process.env.REMONLINE_API_TOKEN}&page=${_page}${idLabelsUrl}${idUrl}${sort_dir_url}${modified_at_url}`;

  const response = await fetch(url);

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

    if ((response.status == 403 && code == 101) || response.status == 401) {
      console.info({ function: 'getOrders', message: 'Get new Auth' });
      await remonlineTokenToEnv(true);
      return await getOrders({ idLabels, ids }, _page, _orders);
    }

    console.error({
      function: 'getOrders',
      message,
      validation,
      status: response.status,
    });
    return;
  }

  const { data: orders, count, page } = data;

  const doneOnPrevPage = (page - 1) * 50;

  const leftToFinish = count - doneOnPrevPage - orders.length;

  _orders.push(...orders);

  // console.log({ count, page, doneOnPrevPage, leftToFinish });

  if (leftToFinish > 0) {
    return await getOrders(
      { idLabels, ids, modified_at, sort_dir },
      parseInt(page) + 1,
      _orders
    );
  }

  return { orders: _orders, count };
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

    if ((response.status == 403 && code == 101) || response.status == 401) {
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

  if (response.status == 403 || response.status == 401) {
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
    if ((response.status == 403 && code == 101) || response.status == 401) {
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
    if ((response.status == 403 && code == 101) || response.status == 401) {
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
  return { employees };
}
export async function getAssets(_page = 1, _assets = []) {
  const url = `${process.env.REMONLINE_API}/warehouse/assets?page=${_page}&token=${process.env.REMONLINE_API_TOKEN}`;
  // const url = `${process.env.REMONLINE_API}/warehouse/assets?token=${process.env.REMONLINE_API_TOKEN}`;

  const options = { method: 'GET', headers: { accept: 'application/json' } };

  const response = await fetch(url, options);

  const data = await response.json();
  const { success } = data;
  if (!success) {
    const { message, code } = data;
    const { validation } = message;
    if ((response.status == 403 && code == 101) || response.status == 401) {
      console.info({ function: 'getAssets', message: 'Get new Auth' });
      await remonlineTokenToEnv(true);
      return await getAssets(_page, _assets);
    }
    console.error({
      function: 'getAssets',
      url,
      message,
      validation,
      status: response.status,
    });
    return;
  }
  const { data: assets, page, count } = data;
  const doneOnPrevPage = (page - 1) * 50;

  const leftToFinish = count - doneOnPrevPage - assets.length;

  _assets.push(...structuredClone(assets));
  console.log({ count, page, doneOnPrevPage, leftToFinish });
  if (leftToFinish > 0) {
    return await getAssets(parseInt(page) + 1, _assets);
  }
  return { assets: _assets };
}
export async function getUOMs() {
  const url = `${process.env.REMONLINE_API}/catalogs/uoms?token=${process.env.REMONLINE_API_TOKEN}`;

  const options = { method: 'GET', headers: { accept: 'application/json' } };
  const response = await fetch(url, options);
  let data;
  try {
    data = await response.json();
  } catch (e) {
    console.error({
      function: 'getUOMs',
      message: 'Error parsing JSON',
      data,
    });
  }
  const { success } = data;
  if (!success) {
    const { message, code } = data;
    const { validation } = message;
    if ((response.status == 403 && code == 101) || response.status == 401) {
      console.info({ function: 'getUOMs', message: 'Get new Auth' });
      await remonlineTokenToEnv(true);
      return await getEmployees();
    }
    console.error({
      function: 'getUOMs',
      message,
      validation,
      status: response.status,
    });
    return;
  }

  const { uoms, uom_types, entity_types } = data;
  return { uoms, uom_types, entity_types };
}

export async function getOrderStatuses() {
  const url = 'https://api.roapp.io/statuses/orders';
  
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${process.env.REMONLINE_API_TOKEN}`,
    },
  };

  const response = await fetch(url, options);

  if (!response.ok) {
    console.error({
      function: 'getOrderStatuses',
      status: response.status,
      statusText: response.statusText,
    });
    throw new Error(`Failed to fetch order statuses: ${response.statusText}`);
  }

  const data = await response.json();
  const { success, data: statuses, count } = data;

  if (!success) {
    console.error({
      function: 'getOrderStatuses',
      message: 'API returned success: false',
    });
    throw new Error('API returned unsuccessful response');
  }

  console.log({
    function: 'getOrderStatuses',
    count,
    statusesCount: statuses.length,
  });

  return { statuses, count };
}
