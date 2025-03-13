import { updateDealsOpportunity, chunkArray } from '../bitrix.utils.mjs';
import {
  getDriversWithRevenueWitnDealSyncReady,
  updateSyncTimeForDriversWithRevenue,
} from '../bitrix.queries.mjs';

export async function syncRevenueToDeals() {
  const { driversWithRevenueWitnDeal } =
    await getDriversWithRevenueWitnDealSyncReady();

  const driversWithRevenueWitnDealChunked = chunkArray(
    driversWithRevenueWitnDeal,
    50
  );
  const startTotal = performance.now();

  for (let chunk of driversWithRevenueWitnDealChunked) {
    const start = performance.now();

    try {
      const { result, result_time } = await updateDealsOpportunity({
        drivers: chunk,
      });

      let updatedDealsInChunk = [];
      for (let [deal_id, is_updated] of Object.entries(result)) {
        if (!is_updated) {
          continue;
        }

        updatedDealsInChunk.push({ deal_id });
      }

      await updateSyncTimeForDriversWithRevenue(updatedDealsInChunk);

      const maxOperating = Object.values(result_time).reduce((max, current) => {
        return current.operating > max ? current.operating : max;
      }, 0);

      // console.log("Максимальное значение operating:", maxOperating);

      if (maxOperating >= 300) {
        break;
      }

      const end = performance.now();
      console.log(
        `chunk done in: ${Math.round((end - start) / 1000)} sec. maxOperating: ${maxOperating}`
      );
    } catch (error) {
      console.error({ message: 'Failed updateDealsOpportunity', error, chunk });
    }
  }

  const endTotal = performance.now();
  console.log(
    `chunkArray done in: ${Math.round((endTotal - startTotal) / 1000)} sec.`
  );
}

if (process.env.ENV == 'TEST') {
  await syncRevenueToDeals();
}
