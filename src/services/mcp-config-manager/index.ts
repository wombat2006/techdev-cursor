export { MCPConfigManager } from './manager';
export { estimateToolCosts } from './cost-estimation';
export {
  applyContextualOptimizations,
  getToolPrioritiesForTask,
  isSecurityLevelAllowed,
  isToolEnvironmentReady,
} from './selection';
export { buildDefaultToolConfigurations } from './defaults';
export type {
  MCPApprovalConfig,
  MCPConfigContext,
  MCPToolConfig,
} from './types';
export { COST_THRESHOLDS } from './types';

import { MCPConfigManager } from './manager';

export const mcpConfigManager = new MCPConfigManager();
export default mcpConfigManager;
