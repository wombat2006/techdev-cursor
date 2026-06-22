import promClient from 'prom-client';
import { register } from './registry';

// HTTP リクエスト総数
export const httpRequestsTotal = new promClient.Counter({
  name: 'techsapo_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// HTTP リクエスト処理時間
export const httpRequestDuration = new promClient.Histogram({
  name: 'techsapo_http_request_duration_seconds',
  help: 'HTTP request processing time in seconds',
  buckets: [0.1, 0.3, 0.5, 0.7, 1.0, 1.5, 2.0, 3.0, 5.0, 7.0, 10.0],
  labelNames: ['method', 'route'],
  registers: [register]
});

// HTTP リクエストサイズ
export const httpRequestSize = new promClient.Histogram({
  name: 'techsapo_http_request_size_bytes',
  help: 'HTTP request size in bytes',
  buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
  registers: [register]
});

// HTTP レスポンスサイズ
export const httpResponseSize = new promClient.Histogram({
  name: 'techsapo_http_response_size_bytes',
  help: 'HTTP response size in bytes',
  buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
  registers: [register]
});

// HTTP リクエストを記録
export function recordHttpRequest(
  method: string,
  route: string,
  statusCode: number,
  duration: number,
  requestSize?: number,
  responseSize?: number
): void {
  httpRequestsTotal.inc({ method, route, status_code: statusCode.toString() });
  httpRequestDuration.observe({ method, route }, duration / 1000);
  
  if (requestSize) {
    httpRequestSize.observe(requestSize);
  }
  if (responseSize) {
    httpResponseSize.observe(responseSize);
  }
}
