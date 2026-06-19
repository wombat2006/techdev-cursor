/**
 * Contract Layer — simulated LLM paths must not masquerade as real provider calls.
 */

export const SIMULATED_PROVIDER_LOG_TAG = '[SIMULATED_PROVIDER]';

export function isSimulatedProvidersAllowed(): boolean {
  if (process.env.TECHSAPO_ALLOW_SIMULATED_PROVIDERS === '1') {
    return true;
  }
  return process.env.NODE_ENV === 'test';
}

export function assertSimulatedProvidersAllowed(caller: string): void {
  if (isSimulatedProvidersAllowed()) {
    return;
  }
  throw new Error(
    `${SIMULATED_PROVIDER_LOG_TAG} ${caller} is disabled. ` +
      'Use unified MCP adapters (analyze_*) or set TECHSAPO_ALLOW_SIMULATED_PROVIDERS=1 for legacy paths. ' +
      'Track B-1 replaces mcp-clients simulate with real adapters.'
  );
}
