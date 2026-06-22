import promClient from 'prom-client';
import { register } from './registry';

// 認証試行回数
export const authAttemptsTotal = new promClient.Counter({
  name: 'techsapo_auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['status', 'method'],
  registers: [register]
});

// レート制限ヒット数
export const rateLimitHitsTotal = new promClient.Counter({
  name: 'techsapo_rate_limit_hits_total',
  help: 'Total number of rate limit hits',
  labelNames: ['endpoint', 'client_ip'],
  registers: [register]
});

// 入力サニタイゼーション
export const inputSanitizationTotal = new promClient.Counter({
  name: 'techsapo_input_sanitization_total',
  help: 'Total number of input sanitization events',
  labelNames: ['type', 'blocked'],
  registers: [register]
});
