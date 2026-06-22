export interface MCPToolConfig {
  type: 'mcp';
  server_label: string;
  server_url?: string;
  connector_id?: string;
  authorization?: string;
  require_approval: 'always' | 'never' | MCPApprovalConfig;
  allowed_tools: string[];
  cost_tier?: 'free' | 'low' | 'medium' | 'high';
  security_level?: 'public' | 'internal' | 'sensitive' | 'critical';
}

export interface MCPApprovalConfig {
  always?: { tool_names: string[] };
  never?: { tool_names: string[] };
  conditional?: {
    tool_names: string[];
    conditions: (context: MCPConfigContext) => boolean;
  };
}

export interface MCPConfigContext {
  taskType: 'basic' | 'premium' | 'critical';
  budgetTier: 'free' | 'standard' | 'premium';
  securityLevel: 'public' | 'internal' | 'sensitive' | 'critical';
  userRole?: string;
  projectId?: string;
}

export const COST_THRESHOLDS = {
  free: { maxTools: 1, maxCalls: 10 },
  standard: { maxTools: 3, maxCalls: 50 },
  premium: { maxTools: 10, maxCalls: 200 },
} as const;
