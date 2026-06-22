/**
 * Simple vs technical query classification
 */
export function isSimpleQuery(query: string): boolean {
  const trimmedQuery = query.trim();
  const lowerQuery = trimmedQuery.toLowerCase();
  
  // 最低文字数チェック（1-2文字の単語は除外）
  if (trimmedQuery.length < 3) {
    return false;
  }
  
  // 技術用語ブラックリスト - これらを含む場合は技術的クエリ
  const technicalKeywords = [
    '実装', '設計', 'コード', 'API', 'エンドポイント', 
    'アーキテクチャ', 'マイクロサービス', 'データベース',
    '最適化', 'パフォーマンス', 'セキュリティ', 'TypeScript',
    'JavaScript', 'Python', 'システム', '開発', 'プログラム',
    'カバレッジ', 'ユニット', '統合テスト', 'E2E'
  ];
  
  // 技術用語が含まれていたら技術的クエリ
  if (technicalKeywords.some(keyword => lowerQuery.includes(keyword.toLowerCase()))) {
    return false;
  }
  
  // シンプルなクエリのパターン
  const simplePatterns = [
    /^(hello|hi|hey|こんにちは|おはよう|こんばんは)$/i,
    /^test$/i,
    /^(テストの?返事|返事.*テスト)$/,
    /^(ok|okay|thanks?|ありがと|サンクス)$/i,
    /^(ping|pong|echo)$/i,
    /^(確認|チェック|動作確認)$/,
  ];
  
  // 20文字以下で、シンプルパターンに厳密マッチ
  if (trimmedQuery.length <= 20 && simplePatterns.some(pattern => pattern.test(trimmedQuery))) {
    return true;
  }
  
  // 「〜を返してください」「〜してください」のような単純な要求（技術用語なし）
  const simpleRequestPatterns = [
    /^.{1,15}(を?返してください|してください|お願いします)$/,
  ];
  
  if (trimmedQuery.length <= 25 && simpleRequestPatterns.some(pattern => pattern.test(trimmedQuery))) {
    return true;
  }
  
  return false;
}
