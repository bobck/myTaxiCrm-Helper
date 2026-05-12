import fetch from 'node-fetch';
import { remonlineTokenToEnv } from './remonline.api.mjs';
import { devLog } from '../shared/shared.utils.mjs';
import { db } from '../shared/sqlite.mjs';

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

export async function getOrders({ idLabels, ids, modified_at, sort_dir }) {
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

  const allOrders = [];
  let _page = 1;
  let count;

  while (true) {
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
        continue;
      }

      console.error({
        function: 'getOrders',
        message,
        validation,
        status: response.status,
      });
      return;
    }

    const { data: orders, count: totalCount, page } = data;
    count = totalCount;

    const doneOnPrevPage = (page - 1) * 50;
    const leftToFinish = count - doneOnPrevPage - orders.length;

    allOrders.push(...orders);

    devLog({
      function: 'getOrders',
      page,
      count,
      fetched: orders.length,
      totalFetched: allOrders.length,
      leftToFinish,
    });

    if (leftToFinish <= 0) break;
    _page = parseInt(page) + 1;
  }

  return { orders: allOrders, count };
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

export async function getCashboxTransactions({ createdAt, cashboxId }) {
  let createdAtUrl = '';
  if (createdAt) {
    createdAtUrl += `&created_at[]=${createdAt}`;
  }

  const allTransactions = [];
  let _page = 1;

  while (true) {
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
      continue;
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
      const leftToFinish = count - doneOnPrevPage - transactions.length;

      allTransactions.push(...transactions);

      devLog({
        function: 'getCashboxTransactions',
        page,
        count,
        fetched: transactions.length,
        totalFetched: allTransactions.length,
        leftToFinish,
      });

      if (leftToFinish <= 0) break;
      _page = parseInt(page) + 1;
    } catch (e) {
      console.error({
        function: 'getCashboxTransactions',
        e: e?.message,
        response_status: response.status,
      });
      throw response.status;
    }
  }

  return { transactions: allTransactions };
}
export async function getCashboxes() {
  while (true) {
    const url = `${process.env.REMONLINE_API}/cashbox/?token=${process.env.REMONLINE_API_TOKEN}`;

    const response = await fetch(url);

    if (
      response.status == 414 ||
      response.status == 503 ||
      response.status == 502 ||
      response.status == 504
    ) {
      throw await response.text();
    }

    if (response.status == 403 || response.status == 401) {
      console.info({ function: 'getCashboxes', message: 'Get new Auth' });
      await remonlineTokenToEnv(true);
      continue;
    }

    const data = await response.json();
    const { success } = data;

    if (!success) {
      const { message, code } = data;
      if ((response.status == 403 && code == 101) || response.status == 401) {
        console.info({ function: 'getCashboxes', message: 'Get new Auth' });
        await remonlineTokenToEnv(true);
        continue;
      }
      console.error({
        function: 'getCashboxes',
        message,
        status: response.status,
      });
      throw message;
    }

    const { data: cashboxes, count } = data;

    devLog({
      function: 'getCashboxes',
      count,
      fetched: cashboxes.length,
    });

    return { cashboxes };
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

export async function getTransfers({ branch_id }) {
  const options = { method: 'GET', headers: { accept: 'application/json' } };
  const allTransfers = [];
  let _page = 1;

  while (true) {
    const url = `${process.env.REMONLINE_API}/warehouse/moves/?page=${_page}&branch_id=${branch_id}&token=${process.env.REMONLINE_API_TOKEN}`;

    const response = await fetch(url, options);

    const data = await response.json();
    const { success } = data;
    if (!success) {
      const { message, code } = data;
      const { validation } = message;
      if ((response.status == 403 && code == 101) || response.status == 401) {
        console.info({ function: 'getTransfers', message: 'Get new Auth' });
        await remonlineTokenToEnv(true);
        continue;
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

    allTransfers.push(
      ...transfers.map((transfer) => {
        return { branch_id, ...transfer };
      })
    );

    devLog({
      function: 'getTransfers',
      branch_id,
      page,
      count,
      fetched: transfers.length,
      totalFetched: allTransfers.length,
      leftToFinish,
    });

    if (leftToFinish <= 0) break;
    _page = parseInt(page) + 1;
  }

  return { transfers: allTransfers };
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
export async function getAssets() {
  const options = { method: 'GET', headers: { accept: 'application/json' } };
  const allAssets = [];
  let _page = 1;
  const isTest = process.env.ENV === 'TEST';
  const TEST_PAGE_LIMIT = 10;

  while (true) {
    const url = `${process.env.REMONLINE_API}/warehouse/assets?page=${_page}&token=${process.env.REMONLINE_API_TOKEN}`;

    const response = await fetch(url, options);

    const data = await response.json();
    const { success } = data;
    if (!success) {
      const { message, code } = data;
      const { validation } = message;
      if ((response.status == 403 && code == 101) || response.status == 401) {
        console.info({ function: 'getAssets', message: 'Get new Auth' });
        await remonlineTokenToEnv(true);
        continue;
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

    allAssets.push(...assets);

    devLog({
      function: 'getAssets',
      page,
      count,
      fetched: assets.length,
      totalFetched: allAssets.length,
      leftToFinish,
    });

    if (leftToFinish <= 0) break;
    if (isTest && _page >= TEST_PAGE_LIMIT) {
      devLog({
        function: 'getAssets',
        message: `TEST mode: stop after ${TEST_PAGE_LIMIT} pages`,
      });
      break;
    }
    _page = parseInt(page) + 1;
  }

  return { assets: allAssets };
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
      return await getUOMs();
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

export async function getPostings(
  { createdAtFrom, createdAtTo },
  _page = 1,
  _postings = [],
  _attempt = 1
) {
  const MAX_RETRIES = 3;
  if (!createdAtFrom && !createdAtTo) {
    return { postings: _postings };
  }
  const createdAtUrl = `&created_at[]=${createdAtFrom}&created_at[]=${createdAtTo}`;
  const url = `${process.env.ROAPP_API}/warehouse/postings/?page=${_page}${createdAtUrl}&token=${process.env.REMONLINE_API_TOKEN}`;

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
    },
  };

  try {
    const response = await fetch(url, options);

    if (
      response.status === 414 ||
      response.status === 429 ||
      response.status === 500 ||
      response.status === 502 ||
      response.status === 503 ||
      response.status === 504
    ) {
      const error = new Error(`API error: HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }

    let data;
    try {
      data = await response.json();
    } catch (e) {
      const error = new Error('Error parsing JSON');
      error.originalError = e;
      error.status = response.status;
      throw error;
    }

    const { success } = data;
    if (!success) {
      const { message } = data;
      const error = new Error(`Unsuccessful response: ${message}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    const { data: postings, count, page } = data;
    const doneOnPrevPage = (page - 1) * 50;
    const leftToFinish = count - doneOnPrevPage - postings.length;
    const pageSize = postings.length || 50;
    const pagesLeft = leftToFinish > 0 ? Math.ceil(leftToFinish / pageSize) : 0;

    devLog({
      function: 'getPostings',
      message: 'Fetched postings page',
      page,
      count,
      postingsReceived: postings?.length,
      leftToFinish,
      pagesLeftToFetch: pagesLeft,
      lastCreatedAt: postings?.length
        ? postings[postings.length - 1]?.created_at
        : null,
    });

    _postings.push(...postings);

    if (leftToFinish > 0) {
      return await getPostings(
        { createdAtFrom, createdAtTo },
        parseInt(page) + 1,
        _postings
      );
    }

    devLog({
      function: 'getPostings',
      message: 'Finished fetching all postings',
      totalPostings: _postings.length,
      totalCount: count,
    });

    return { postings: _postings, count };
  } catch (error) {
    if (_attempt <= MAX_RETRIES) {
      const delay = 1000 * Math.pow(2, _attempt - 1);
      devLog({
        function: 'getPostings',
        message: `Retryable error: ${error.message}, retrying...`,
        status: error.status,
        url,
        page: _page,
        attempt: _attempt,
        delayMs: delay,
      });
      await new Promise((r) => setTimeout(r, delay));
      return await getPostings(
        { createdAtFrom, createdAtTo },
        _page,
        _postings,
        _attempt + 1
      );
    }

    devLog({
      function: 'getPostings',
      message: `Error after max retries: ${error.message}`,
      status: error.status,
      url,
      page: _page,
      attempt: _attempt,
      fetchedPostingsSoFar: _postings.length,
    });

    error.page = _page;
    error.url = url;
    error.postings = _postings;
    throw error;
  }
}

export async function* getProducts(_page = 1, _attempt = 1) {
  const MAX_RETRIES = 3;

  while (true) {
    const url = `${process.env.ROAPP_API}/products/?page=${_page}&token=${process.env.REMONLINE_API_TOKEN}`;

    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
    };

    try {
      const response = await fetch(url, options);

      if (
        response.status === 414 ||
        response.status === 429 ||
        response.status === 500 ||
        response.status === 502 ||
        response.status === 503 ||
        response.status === 504
      ) {
        const error = new Error(`API error: HTTP ${response.status}`);
        error.status = response.status;
        throw error;
      }

      let data;
      try {
        data = await response.json();
      } catch (e) {
        const error = new Error('Error parsing JSON');
        error.originalError = e;
        error.status = response.status;
        throw error;
      }

      const { success } = data;
      if (!success) {
        const { message, code } = data;

        if ((response.status == 403 && code == 101) || response.status == 401) {
          devLog({ function: 'getProducts', message: 'Get new Auth' });
          await remonlineTokenToEnv(true);
          // Retry the same page with new token
          _attempt = 1;
          continue;
        }

        const error = new Error(`Unsuccessful response: ${message}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      const { data: products, count, page } = data;
      const pageSize = 50;

      devLog({
        function: 'getProducts',
        message: 'Fetched products page',
        page,
        count,
        productsReceived: products?.length,
      });

      if (products && products.length > 0) {
        yield { products, page, count };
      }

      if (!products || products.length < pageSize) {
        devLog({
          function: 'getProducts',
          message: 'Finished fetching all products',
        });
        break;
      }

      // Prepare for next page
      _page = parseInt(page) + 1;
      _attempt = 1;
    } catch (error) {
      if (_attempt <= MAX_RETRIES) {
        const delay = 1000 * Math.pow(2, _attempt - 1);
        devLog({
          function: 'getProducts',
          message: `Retryable error: ${error.message}, retrying...`,
          status: error.status,
          url,
          page: _page,
          attempt: _attempt,
          delayMs: delay,
        });
        await new Promise((r) => setTimeout(r, delay));
        _attempt++;
        continue;
      }

      devLog({
        function: 'getProducts',
        message: `Error after max retries: ${error.message}`,
        status: error.status,
        url,
        page: _page,
        attempt: _attempt,
      });

      error.page = _page;
      error.url = url;
      throw error;
    }
  }
}

const V2_RETRYABLE_STATUSES = new Set([414, 429, 500, 502, 503, 504]);
const V2_MAX_RETRIES = 3;
const V2_MAX_AUTH_RETRIES = 3;

/**
 * The roapp.io API rejects ISO timestamps with millisecond precision
 * (`Invalid ISO8601 format. Expected: %Y-%m-%dT%H:%M:%SZ`). Trim them.
 */
function toApiIso(value) {
  if (!value) return value;
  // Date.toISOString() always returns YYYY-MM-DDTHH:mm:ss.sssZ — drop the .sss.
  return String(value).replace(/\.\d+Z$/, 'Z');
}

function buildV2Query(params) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null) continue;
        qs.append(`${key}[]`, String(item));
      }
    } else {
      qs.append(key, String(value));
    }
  }
  return qs.toString();
}

function v2Headers() {
  return {
    accept: 'application/json',
    Authorization: `Bearer ${process.env.REMONLINE_API_TOKEN}`,
  };
}

async function fetchV2WithRetry({
  url,
  fnName,
  retryAttempt = 1,
  authAttempt = 1,
}) {
  const response = await fetch(url, {
    method: 'GET',
    headers: v2Headers(),
  });

  if (V2_RETRYABLE_STATUSES.has(response.status)) {
    if (retryAttempt > V2_MAX_RETRIES) {
      const error = new Error(
        `${fnName}: HTTP ${response.status} after ${V2_MAX_RETRIES} retries`
      );
      error.status = response.status;
      throw error;
    }
    const delay = 1000 * Math.pow(2, retryAttempt - 1);
    devLog({
      function: fnName,
      message: `Retryable HTTP ${response.status}, retrying`,
      url,
      retryAttempt,
      delayMs: delay,
    });
    await new Promise((r) => setTimeout(r, delay));
    return fetchV2WithRetry({
      url,
      fnName,
      retryAttempt: retryAttempt + 1,
      authAttempt,
    });
  }

  if (response.status === 401 || response.status === 403) {
    if (authAttempt > V2_MAX_AUTH_RETRIES) {
      const error = new Error(
        `${fnName}: HTTP ${response.status} after ${V2_MAX_AUTH_RETRIES} auth retries`
      );
      error.status = response.status;
      throw error;
    }
    devLog({
      function: fnName,
      message: 'Auth refresh, retrying',
      authAttempt,
    });
    await remonlineTokenToEnv(true);
    return fetchV2WithRetry({
      url,
      fnName,
      retryAttempt,
      authAttempt: authAttempt + 1,
    });
  }

  return response;
}

async function readV2Json({ response, fnName }) {
  if (!response.ok) {
    const text = await response.text();
    const error = new Error(`${fnName}: HTTP ${response.status}: ${text}`);
    error.status = response.status;
    error.body = text;
    throw error;
  }
  try {
    return await response.json();
  } catch (e) {
    const error = new Error(`${fnName}: failed to parse JSON`);
    error.status = response.status;
    error.cause = e;
    throw error;
  }
}

/**
 * Fetch all orders from the v2 API (`{ROAPP_API}/v2/orders`).
 *
 * Sorting follows the documented enum prefix convention:
 *   sort=modified_at        — ascending
 *   sort=-modified_at       — descending (minus prefix)
 *
 * Auth is the same `?token=` mechanism as v1 — only the host differs.
 *
 * @param {object} [opts]
 * @param {string} [opts.modifiedAtFrom] ISO-8601 lower bound for modified_at
 * @param {string} [opts.modifiedAtTo]   ISO-8601 upper bound for modified_at
 * @param {number[]} [opts.ids]          filter by explicit ids
 * @param {string} [opts.sort='modified_at']  enum: 'modified_at' | '-modified_at'
 * @param {number} [opts.pageLimit]      stop after this many pages (caller-driven cap)
 * @returns {Promise<{ orders: object[], count: number }>}
 */
export async function getOrdersV2({
  modifiedAtFrom,
  modifiedAtTo,
  ids,
  sort = 'modified_at',
  pageLimit,
} = {}) {
  const allOrders = [];
  let page = 1;

  const modifiedAtRange = [];
  if (modifiedAtFrom) modifiedAtRange.push(toApiIso(modifiedAtFrom));
  if (modifiedAtTo) modifiedAtRange.push(toApiIso(modifiedAtTo));

  while (true) {
    const qs = buildV2Query({
      page,
      sort,
      modified_at: modifiedAtRange.length ? modifiedAtRange : undefined,
      ids: ids && ids.length ? ids : undefined,
    });
    const url = `${process.env.ROAPP_API}/v2/orders${qs ? `?${qs}` : ''}`;

    const response = await fetchV2WithRetry({ url, fnName: 'getOrdersV2' });
    const data = await readV2Json({ response, fnName: 'getOrdersV2' });

    const orders = data.data || [];
    const paging = data.paging || {};
    allOrders.push(...orders);

    devLog({
      function: 'getOrdersV2',
      page: paging.page,
      total_pages: paging.total_pages,
      count: paging.count,
      fetched: orders.length,
      totalFetched: allOrders.length,
    });

    if (!paging.total_pages || page >= paging.total_pages) break;
    if (pageLimit && page >= pageLimit) {
      devLog({
        function: 'getOrdersV2',
        message: `pageLimit reached, stopping at page ${page}`,
      });
      break;
    }
    page += 1;
  }

  return { orders: allOrders, count: allOrders.length };
}

/**
 * Line items (parts/works/services/products) for one order. Endpoint returns
 * a bare array — no paging wrapper.
 */
export async function getOrderItems(orderId) {
  const url = `${process.env.ROAPP_API}/v2/orders/${orderId}/items`;
  const response = await fetchV2WithRetry({ url, fnName: 'getOrderItems' });

  if (response.status === 404) return [];

  const data = await readV2Json({ response, fnName: 'getOrderItems' });
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

/**
 * Fetch items for many orders one-by-one, attaching `order_id` to each
 * returned item. Failures for individual orders are logged and skipped.
 */
export async function getOrderItemsBatch(orderIds) {
  const items = [];
  const failedOrderIds = [];

  for (let i = 0; i < orderIds.length; i += 1) {
    const orderId = orderIds[i];
    try {
      const orderItems = await getOrderItems(orderId);
      for (const item of orderItems) {
        items.push({ order_id: orderId, ...item });
      }
    } catch (e) {
      console.error({
        function: 'getOrderItemsBatch',
        orderId,
        status: e.status,
        message: e.message,
      });
      failedOrderIds.push(orderId);
    }

    devLog({
      function: 'getOrderItemsBatch',
      processed: i + 1,
      total: orderIds.length,
      itemsSoFar: items.length,
      failedSoFar: failedOrderIds.length,
    });
  }

  return { items, failedOrderIds };
}

export async function getRefunds({ createdAt } = {}) {
  const MAX_AUTH_RETRIES = 3;
  const createdAtUrl = createdAt ? `&created_at=${createdAt}` : '';
  const allRefunds = [];
  let _page = 1;
  let _authRetries = 0;

  while (true) {
    const response = await fetch(
      `${process.env.ROAPP_API}/v2/finance/refunds?token=${process.env.REMONLINE_API_TOKEN}&page=${_page}${createdAtUrl}`
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
      _authRetries++;
      if (_authRetries > MAX_AUTH_RETRIES) {
        throw new Error(
          `getRefunds: auth failed after ${MAX_AUTH_RETRIES} retries`
        );
      }
      console.info({
        function: 'getRefunds',
        message: `Get new Auth (attempt ${_authRetries}/${MAX_AUTH_RETRIES})`,
      });
      await remonlineTokenToEnv(true);
      continue;
    }

    try {
      const data = await response.json();
      const { paging, data: refunds } = data;

      allRefunds.push(...refunds);

      devLog({
        function: 'getRefunds',
        page: paging.page,
        totalPages: paging.total_pages,
        count: paging.count,
        fetched: refunds.length,
        totalFetched: allRefunds.length,
      });

      if (_page >= paging.total_pages) break;
      _page++;
    } catch (e) {
      console.error({
        function: 'getRefunds',
        e: e?.message,
        response_status: response.status,
      });
      throw response.status;
    }
  }

  return { refunds: allRefunds };
}
