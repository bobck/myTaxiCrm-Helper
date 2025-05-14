import Bottleneck from 'bottleneck';
const bitrixCrmDealListLimiterProps = {
  maxConcurrent: 1,
  minTime: parseInt(process.env.BITRIX_LIMITER_MIN_TIME),
};
export const bitrixCrmDealListLimiter = new Bottleneck(
  bitrixCrmDealListLimiterProps
);
