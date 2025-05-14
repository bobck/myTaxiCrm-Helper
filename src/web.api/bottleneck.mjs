import Bottleneck from 'bottleneck';

export const globalLimiter = new Bottleneck({
  maxConcurrent: 2,
  minTime: parseInt(process.env.BOTTLE_NECK_MIN_TIME),
});
