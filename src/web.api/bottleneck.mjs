import Bottleneck from "bottleneck";

export const globalLimiter = new Bottleneck({
  maxConcurrent: 2,
  minTime: 1800,
});