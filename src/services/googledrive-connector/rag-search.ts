import { logger } from '../../utils/logger';

export async function searchRAG(
  openai: any,
  query: string,
  vectorStoreId?: string,
  maxResults: number = 5
): Promise<{
  results: any[];
  usage: any;
}> {
  try {
    logger.info('🔍 RAG検索実行開始 (MCP Enhanced)', { query, vectorStoreId, maxResults });

    // MCP tools configuration for enhanced Google Drive integration
    const mcpTools = [];

    // Official Google Drive MCP Connector (if available and configured)
    if (process.env.GOOGLE_DRIVE_MCP_ENABLED === 'true' && process.env.GOOGLE_OAUTH_TOKEN) {
      mcpTools.push({
        type: "mcp",
        server_label: "google_drive",
        server_url: "https://api.googledrive.mcp/connector", // Placeholder URL for connector
        authorization: process.env.GOOGLE_OAUTH_TOKEN,
        require_approval: { 
          never: { 
            tool_names: ["search", "recent_documents", "fetch"] 
          }
        },
        allowed_tools: ["search", "recent_documents", "fetch"]
      } as any); // Temporary bypass for cutting-edge MCP functionality
      logger.info('🔗 Google Drive MCP Connector enabled');
    }

    // Context7 MCP for technical documentation enhancement
    if (process.env.CONTEXT7_MCP_ENABLED === 'true') {
      mcpTools.push({
        type: "mcp",
        server_label: "context7_docs",
        server_url: "https://api.context7.com/mcp",
        authorization: process.env.CONTEXT7_API_KEY,
        require_approval: "never",
        allowed_tools: ["get_library_docs", "resolve_library_id"]
      });
      logger.info('📚 Context7 MCP enabled for technical documentation');
    }

    // Traditional file_search tool (fallback or primary depending on configuration)
    const tools: any[] = [...mcpTools];
    if (vectorStoreId && !process.env.GOOGLE_DRIVE_MCP_ONLY) {
      tools.push({ 
        type: 'file_search',
        vector_store_ids: [vectorStoreId]
      });
    }

    // Using new Responses API with MCP integration
    const response = await openai.responses.create({
      model: 'gpt-5', // Using GPT-5 for better performance
      tools,
      instructions: `You are a helpful IT infrastructure support assistant that answers questions based on documents from GoogleDrive and technical documentation.

利用可能なツール:
- Google Drive MCP: リアルタイムドキュメント検索とアクセス
- Context7 MCP: 技術ドキュメントとライブラリリファレンス
- File Search: ベクターストア検索（従来方式）

Always provide detailed answers in Japanese and cite the source documents when possible. When using MCP tools, leverage real-time access for the most current information.`,
      input: query,
      store: true, // Enable stateful context for better reasoning
      reasoning: {
        effort: 'medium'
      }
    });

    // Extract results from the new Responses API format with MCP support
    const results = [{
      content: response.output_text || 'No response generated',
      annotations: [], // Responses API handles citations internally
      mcp_calls: response.output?.filter(item => item.type === 'mcp_call') || []
    }];

    logger.info('✅ RAG検索完了 (Responses API + MCP)', { 
      query, 
      resultCount: results.length,
      mcp_tools_used: mcpTools.length,
      mcp_calls: response.output?.filter(item => item.type === 'mcp_call')?.length || 0,
      usage: response.usage 
    });

    return {
      results,
      usage: response.usage
    };

  } catch (error) {
    logger.error('❌ RAG検索エラー', { 
      query, 
      vectorStoreId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}

export async function searchWithMCP(
  openai: any,
  query: string,
  options: {
    searchRecent?: boolean;
    maxResults?: number;
    fileTypes?: string[];
  } = {}
): Promise<{
  results: any[];
  mcp_calls: any[];
  usage: any;
}> {
  const { searchRecent = false, maxResults = 10, fileTypes = [] } = options;
  
  try {
    logger.info('🚀 MCP-Enhanced Google Drive Search', { 
      query, 
      searchRecent, 
      maxResults, 
      fileTypes 
    });

    if (!process.env.GOOGLE_DRIVE_MCP_ENABLED || !process.env.GOOGLE_OAUTH_TOKEN) {
      throw new Error('Google Drive MCP not configured. Set GOOGLE_DRIVE_MCP_ENABLED=true and GOOGLE_OAUTH_TOKEN');
    }

    // Enhanced search prompt for MCP
    const searchPrompt = searchRecent 
      ? `Find recent documents related to: "${query}". Focus on files modified within the last 30 days.`
      : `Search Google Drive for documents containing: "${query}". Provide detailed summaries with source links.`;

    const response = await openai.responses.create({
      model: 'gpt-5',
      tools: [{
        type: "mcp" as any, // Temporary bypass for cutting-edge MCP functionality
        server_label: "google_drive_search", 
        server_url: "https://api.googledrive.mcp/connector",
        authorization: process.env.GOOGLE_OAUTH_TOKEN,
        require_approval: "never",
        allowed_tools: searchRecent 
          ? ["recent_documents", "search", "fetch"] 
          : ["search", "fetch", "get_profile"]
      } as any],
      instructions: `You are an IT infrastructure support specialist with access to Google Drive documents via MCP.

Your task:
1. Search for relevant documents using the Google Drive MCP connector
2. Provide detailed Japanese summaries with source links
3. Prioritize recent documents if requested
4. Include document metadata (modification dates, file types, sizes)

Always cite your sources and provide actionable insights.`,
      input: searchPrompt,
      store: true,
      reasoning: { effort: 'medium' }
    });

    // Extract MCP call results
    const mcpCalls = response.output?.filter(item => item.type === 'mcp_call') || [];
    
    const results = [{
      content: response.output_text || 'No response generated',
      query,
      search_type: searchRecent ? 'recent' : 'full',
      source: 'google_drive_mcp'
    }];

    logger.info('✅ MCP-Enhanced search completed', {
      query,
      results_count: results.length,
      mcp_calls_count: mcpCalls.length,
      cost_estimate: response.usage?.total_tokens ? (response.usage.total_tokens * 0.00001) : 0
    });

    return {
      results,
      mcp_calls: mcpCalls,
      usage: response.usage
    };

  } catch (error) {
    logger.error('❌ MCP Google Drive search failed', { 
      query, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}
