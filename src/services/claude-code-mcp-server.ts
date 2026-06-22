/**
 * Claude Code MCP Server
 * 
 * MCPサーバとしてClaude Codeを呼び出し、明示的にSonnet 4.6を使用する
 * Wall-Bounce systemからの信頼性の高いモデル選択を保証
 */

import { spawn } from 'child_process';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import logger from '../utils/logger.js';

interface ClaudeCodeQuery {
  prompt: string;
  context?: string;
  model?: string;
  workingDirectory?: string;
  allowedTools?: string[];
  maxTurns?: number;
}

interface ClaudeCodeResult {
  success: boolean;
  result?: string;
  error?: string;
  executionTime: number;
}

/**
 * Claude Codeをサブプロセスとして実行し、Sonnet 4.6で分析を実行
 */
async function executeClaudeCode(query: ClaudeCodeQuery): Promise<ClaudeCodeResult> {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const model = query.model || 'claude-sonnet-4-6';
    const workingDir = query.workingDirectory || process.cwd();
    
    // Claude Code CLI呼び出し
    // --model で明示的にSonnet 4.6を指定
    const args = [
      '--model', model,
      '--permission-mode', 'bypassPermissions',
    ];
    
    // allowedToolsが指定されている場合
    if (query.allowedTools && query.allowedTools.length > 0) {
      args.push('--allowed-tools', query.allowedTools.join(','));
    }
    
    // promptとcontextを結合
    const fullPrompt = query.context 
      ? `${query.prompt}

Context: ${query.context}`
      : query.prompt;
    
    logger.info('🤖 Executing Claude Code', {
      model,
      promptLength: fullPrompt.length,
      workingDir,
      allowedTools: query.allowedTools
    });
    
    // ANTHROPIC_API_KEYを明示的に削除してOAuth認証を使用
    // Claude CLIは~/.claude/.credentials.jsonのMAX subscriptionトークンを自動的に使用
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY;
    
    const claudeProcess = spawn('claude', args, {
      cwd: workingDir,
      env
    });
    
    // stdinにプロンプトを送信（引数ではなくstdin経由）
    claudeProcess.stdin.write(fullPrompt);
    claudeProcess.stdin.end();
    
    let stdout = '';
    let stderr = '';
    
    claudeProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    claudeProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    claudeProcess.on('close', (code) => {
      const executionTime = Date.now() - startTime;
      
      if (code === 0) {
        logger.info('✅ Claude Code execution successful', {
          executionTime,
          outputLength: stdout.length
        });
        
        resolve({
          success: true,
          result: stdout.trim(),
          executionTime
        });
      } else {
        logger.error('❌ Claude Code execution failed', {
          exitCode: code,
          stderr: stderr.substring(0, 500),
          executionTime
        });
        
        resolve({
          success: false,
          error: stderr || `Process exited with code ${code}`,
          executionTime
        });
      }
    });
    
    claudeProcess.on('error', (error) => {
      const executionTime = Date.now() - startTime;
      
      logger.error('❌ Claude Code process error', {
        error: error.message,
        executionTime
      });
      
      resolve({
        success: false,
        error: error.message,
        executionTime
      });
    });
  });
}

/**
 * MCP Tool定義
 */
const tools: Tool[] = [
  {
    name: 'analyze_with_sonnet45',
    description: 'Analyze using Claude Sonnet 4.6 via Claude Code. Ensures reliable model selection for Wall-Bounce system.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'The analysis query or task'
        },
        context: {
          type: 'string',
          description: 'Additional context for the analysis'
        },
        workingDirectory: {
          type: 'string',
          description: 'Working directory for Claude Code execution'
        },
        allowedTools: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of allowed tools (e.g., ["Read", "Grep", "Glob"])'
        },
        maxTurns: {
          type: 'number',
          description: 'Maximum conversation turns (default: 10)'
        }
      },
      required: ['prompt']
    }
  },
  {
    name: 'code_with_sonnet45',
    description: 'Execute coding tasks using Claude Sonnet 4.6 with extended thinking. Best for complex coding and debugging.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'The coding task or bug to fix'
        },
        context: {
          type: 'string',
          description: 'Code context or error messages'
        },
        workingDirectory: {
          type: 'string',
          description: 'Project directory'
        },
        maxTurns: {
          type: 'number',
          description: 'Maximum turns for complex tasks (default: 20)'
        }
      },
      required: ['prompt']
    }
  }
];

/**
 * MCPサーバのセットアップと起動
 */
export async function startClaudeCodeMcpServer(): Promise<void> {
  logger.info('🚀 Starting Claude Code MCP Server...');
  
  const server = new Server(
    {
      name: 'claude-code-sonnet45',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );
  
  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });
  
  // Call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    logger.info('📞 MCP tool called', { name, args });
    
    try {
      if (name === 'analyze_with_sonnet45') {
        const result = await executeClaudeCode({
          prompt: args.prompt as string,
          context: args.context as string | undefined,
          workingDirectory: args.workingDirectory as string | undefined,
          allowedTools: args.allowedTools as string[] | undefined,
          maxTurns: args.maxTurns as number | undefined,
          model: 'claude-sonnet-4-6'
        });
        
        if (result.success) {
          return {
            content: [
              {
                type: 'text',
                text: result.result || ''
              }
            ]
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${result.error}`
              }
            ],
            isError: true
          };
        }
      } else if (name === 'code_with_sonnet45') {
        const result = await executeClaudeCode({
          prompt: args.prompt as string,
          context: args.context as string | undefined,
          workingDirectory: args.workingDirectory as string | undefined,
          allowedTools: ['Read', 'Write', 'Edit', 'Grep', 'Glob', 'Bash'],
          maxTurns: args.maxTurns as number || 20,
          model: 'claude-sonnet-4-6'
        });
        
        if (result.success) {
          return {
            content: [
              {
                type: 'text',
                text: result.result || ''
              }
            ]
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${result.error}`
              }
            ],
            isError: true
          };
        }
      } else {
        throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      logger.error('❌ Tool execution error', { error });
      
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  });
  
  // Start server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  logger.info('✅ Claude Code MCP Server started successfully');
}

// CLI実行時のエントリポイント
if (require.main === module) {
  startClaudeCodeMcpServer().catch((error) => {
    logger.error('Failed to start Claude Code MCP Server', { error });
    process.exit(1);
  });
}
