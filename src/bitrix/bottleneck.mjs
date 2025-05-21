import Bottleneck from 'bottleneck';
const bitrixCrmDealsListLimiterProps = {
  maxConcurrent: 1,
  minTime: parseInt(process.env.BITRIX_LIMITER_MIN_TIME),
};
export const bitrixCrmDealsListLimiter = new Bottleneck(
  bitrixCrmDealsListLimiterProps
);
