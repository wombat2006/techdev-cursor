import { logger } from '../../utils/logger';
import type { LLMResponse, StreamEmit } from './types';

export async function invokeGPT5(
  emit: StreamEmit,
  isSimpleQuery: (q: string) => boolean,
  prompt: string,
  sessionContext?: Record<string, unknown>
): Promise<LLMResponse> {
  try {
    const { spawn } = require('child_process');
    const model = sessionContext?.model || 'gpt-5';
    const specialization = sessionContext?.specialization || 'general';

    logger.info('🤖 GPT-5 Codex CLI実行開始', {
      model,
      specialization,
      promptLength: prompt.length
    });

    // セキュアなプロンプト構築
    const sanitizedPrompt = prompt.replace(/'/g, "'\''");
    
    // クエリの性質に応じてシステムコンテキストを変更
    let systemContext: string;
    if (isSimpleQuery(prompt)) {
      // シンプルなクエリ: そのまま返答
      systemContext = 'あなたは親切なアシスタントです。ユーザーの質問にシンプルかつ直接的に答えてください。技術的な詳細分析は不要です。';
    } else {
      // 技術的なクエリ: 詳細な分析を実施
      systemContext = specialization === 'coding'
        ? 'あなたは経験豊富なソフトウェアエンジニアです。技術的に正確で実践的なコードと解決策を提供してください。'
        : 'あなたは高度な技術コンサルタントです。包括的で実践的な技術分析を提供してください。';
    }

    const fullPrompt = `${systemContext}

ユーザークエリ: ${sanitizedPrompt}

重要: 直接的で簡潔な回答を日本語で提供してください。`;

    // Codex CLI実行 - セキュアなspawn使用
    const args = [
      'exec',
      '--model', model,
      '-c', 'approval_policy="never"',
      fullPrompt
    ];

    const { stdout, stderr } = await new Promise<{stdout: string, stderr: string}>((resolve, reject) => {
      const child = spawn('codex', args, {
        timeout: 120000, // 2 minutes timeout
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env }
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data: any) => {
        const chunk = data.toString();
        stdout += chunk;
        
        // Emit real-time streaming event for each chunk
        emit('provider:streaming', {
          provider: model === 'gpt-5' ? 'gpt-5' : 'gpt-5-codex',
          chunk: chunk,
          timestamp: Date.now()
        });
      });

      child.stderr?.on('data', (data: any) => {
        stderr += data.toString();
      });

      child.on('close', (code: number | null) => {
        if (code === 0 || (code === null && stdout)) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Codex CLI exited with code: ${code}. stderr: ${stderr}`));
        }
      });

      child.on('error', (error: any) => {
        reject(new Error(`Spawn error: ${error.message}`));
      });
    });

    // 出力からLLM応答を抽出（codexのログを除去）
    // Look for the '] codex' marker and extract content after it
    const codexMarker = '] codex';
    const tokensMarker = '] tokens used:';

    let content = '';
    const codexIndex = stdout.lastIndexOf(codexMarker);

    if (codexIndex !== -1) {
      // Extract everything after '] codex'
      let afterCodex = stdout.substring(codexIndex + codexMarker.length);

      // Remove tokens used line if present
      const tokensIndex = afterCodex.indexOf(tokensMarker);
      if (tokensIndex !== -1) {
        afterCodex = afterCodex.substring(0, tokensIndex);
      }

      content = afterCodex.trim();
    } else {
      // Fallback: try to extract non-metadata lines
      const lines = stdout.split('\n');
      const responseLines: string[] = [];
      let inResponse = false;

      for (const line of lines) {
        // Skip Codex CLI metadata lines
        if (line.includes('[2025-') || line.includes('OpenAI Codex') ||
            line.includes('workdir:') || line.includes('model:') ||
            line.includes('provider:') || line.includes('approval:') ||
            line.includes('sandbox:') || line.includes('reasoning') ||
            line.includes('User instructions:') || line.includes('ERROR:') ||
            line.includes('tokens used:') || line.match(/^-+$/)) {
          continue;
        }

        if (line.trim()) {
          inResponse = true;
        }

        if (inResponse && line.trim()) {
          responseLines.push(line);
        }
      }

      content = responseLines.join('\n').trim();
    }

    if (!content) {
      throw new Error('Empty response from Codex CLI');
    }

    logger.info('✅ GPT-5 Codex CLI実行成功', {
      responseLength: content.length,
      model
    });

    return {
      content: `[GPT-5 ${model === 'gpt-5' ? 'Analysis' : 'Codex Analysis'}]\n\n${content}`,
      confidence: 0.92,
      reasoning: `GPT-5 ${specialization === 'coding' ? 'Codex' : ''}による技術分析`,
      cost: 0.001,
      tokens: {
        input: Math.ceil(prompt.length / 4),
        output: Math.ceil(content.length / 4)
      }
    };

  } catch (error) {
    logger.error('❌ GPT-5 Codex CLI実行失敗', {
      error: error instanceof Error ? error.message : String(error)
    });

    // フォールバック: スマートモック
    const mockResponse = `ご質問について分析しました。

技術的観点からの推奨事項：
1. モジュラー設計：疎結合で保守性の高い実装
2. エラーハンドリング：包括的なエラー処理とロギング
3. テスト戦略：ユニットテストと統合テストの実装
4. パフォーマンス：適切なキャッシングと最適化

[注: Codex CLI接続エラーのため、フォールバック応答を使用しています]`;

    return {
      content: `[GPT-5 Fallback Analysis]\n\n${mockResponse}`,
      confidence: 0.65,
      reasoning: 'Codex CLI失敗時のフォールバック応答',
      cost: 0,
      tokens: { input: 0, output: 0 }
    };
  }
}
