import promClient from 'prom-client';

export const register = new promClient.Registry();

// Add default metrics (process_*, nodejs_*)
promClient.collectDefaultMetrics({
  register,
  prefix: 'techsapo_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
  eventLoopMonitoringPrecision: 10,
});
