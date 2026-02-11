import axios from 'axios';
import {
  getPendingRemonlinePostingsForProductCells,
  markRemonlinePostingsAsProductCellsScrapped,
} from '../bq-queries.mjs';
import { devLog } from '../../shared/shared.utils.mjs';

export async function runRemonlineProductCellsJob() {
  const time = new Date();
  console.log({
    time,
    message: 'remonlineProductCellsJob started',
  });

  const host = process.env.REMONLINE_PRIVATE_API_HOST;
  const apiKey = process.env.REMONLINE_PRIVATE_API_KEY;

  if (!host || !apiKey) {
    console.error(
      'REMONLINE_PRIVATE_API_HOST or REMONLINE_PRIVATE_API_KEY is not configured. Skipping remonlineProductCellsJob.',
    );
    // return;
  }

  let postingIds;
  try {
    postingIds = await getPendingRemonlinePostingsForProductCells();
  } catch (error) {
    console.error('Failed to load pending Remonline postings from SQLite', {
      time: new Date(),
      error,
    });
    return;
  }
  devLog(postingIds)

return
  if (!postingIds || postingIds.length === 0) {
    console.log({
      time: new Date(),
      message: 'No pending Remonline postings for product cells scraping.',
    });
    return;
  }

  const client = axios.create({
    baseURL: host,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  });

  try {
    const response = await client.post('/remonline/postings/product-cells', {
      posting_ids: postingIds,
    });

    console.log('[RemonlineProductCells] Private API response summary', {
      time: new Date().toISOString(),
      status: response.status,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      itemsCount: Array.isArray(response.data) ? response.data.length : undefined,
    });

    await markRemonlinePostingsAsProductCellsScrapped({ postingIds });

    console.log('[RemonlineProductCells] Marked postings as product cells scraped', {
      time: new Date().toISOString(),
      postingIdsCount: postingIds.length,
    });
  } catch (error) {
    const status = error?.response?.status;
    const data = error?.response?.data;
    console.error('[RemonlineProductCells] Error calling private API', {
      time: new Date().toISOString(),
      status,
      data,
      postingIdsCount: postingIds.length,
    });
  }
}

