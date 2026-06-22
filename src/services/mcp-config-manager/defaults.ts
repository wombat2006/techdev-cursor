import type { MCPToolConfig } from './types';

/** Build default MCP tool configurations (Cipher, Context7, Drive, Gmail, SharePoint). */
export function buildDefaultToolConfigurations(): Map<string, MCPToolConfig> {
  const configs = new Map<string, MCPToolConfig>();

  configs.set('cipher', {
    type: 'mcp',
    server_label: 'cipher_memory',
    server_url: 'https://cipher.byterover.dev/mcp',
    require_approval: {
      never: { tool_names: ['retrieve_context', 'search_similar'] },
      always: { tool_names: ['delete_memory', 'bulk_update'] },
    },
    allowed_tools: ['store_analysis', 'retrieve_context', 'search_similar_prompts'],
    cost_tier: 'low',
    security_level: 'internal',
  });

  configs.set('context7', {
    type: 'mcp',
    server_label: 'context7_docs',
    server_url: 'https://api.context7.com/mcp',
    authorization: process.env.CONTEXT7_API_KEY,
    require_approval: 'never',
    allowed_tools: ['get_library_docs', 'resolve_library_id', 'search_technical_patterns'],
    cost_tier: 'free',
    security_level: 'public',
  });

  configs.set('google_drive', {
    type: 'mcp',
    server_label: 'google_drive',
    connector_id: 'connector_googledrive',
    authorization: process.env.GOOGLE_OAUTH_TOKEN,
    require_approval: {
      never: { tool_names: ['search', 'recent_documents', 'fetch'] },
      always: { tool_names: ['delete', 'share', 'move'] },
    },
    allowed_tools: ['search', 'recent_documents', 'fetch', 'get_profile'],
    cost_tier: 'medium',
    security_level: 'internal',
  });

  configs.set('gmail', {
    type: 'mcp',
    server_label: 'gmail_tickets',
    connector_id: 'connector_gmail',
    authorization: process.env.GMAIL_OAUTH_TOKEN,
    require_approval: {
      never: { tool_names: ['search_emails', 'read_email'] },
      always: { tool_names: ['send_email', 'delete_email'] },
    },
    allowed_tools: ['search_emails', 'read_email', 'get_profile'],
    cost_tier: 'high',
    security_level: 'sensitive',
  });

  configs.set('sharepoint', {
    type: 'mcp',
    server_label: 'sharepoint_kb',
    connector_id: 'connector_sharepoint',
    authorization: process.env.SHAREPOINT_OAUTH_TOKEN,
    require_approval: {
      never: { tool_names: ['search', 'fetch', 'list_recent_documents'] },
      conditional: {
        tool_names: ['get_site'],
        conditions: (ctx) => ctx.taskType === 'critical',
      },
    },
    allowed_tools: ['search', 'fetch', 'list_recent_documents', 'get_site'],
    cost_tier: 'medium',
    security_level: 'internal',
  });

  return configs;
}
