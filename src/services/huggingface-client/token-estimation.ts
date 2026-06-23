export function estimateTokenCount(text: string | string[]): number {
  if (Array.isArray(text)) {
    return text.reduce((total, item) => total + estimateTokenCount(item), 0);
  }

  const japaneseCharCount = (text.match(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g) || []).length;
  const otherCharCount = text.length - japaneseCharCount;

  return Math.ceil(japaneseCharCount * 1.5 + otherCharCount * 0.25);
}
