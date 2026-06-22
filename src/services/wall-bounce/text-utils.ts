export function truncate(text: string, length: number): string {
  return text.length > length ? `${text.slice(0, length - 3)}...` : text;
}

export function truncateForDisplay(text: string, length: number): string {
  if (!text) return '（空）';
  if (text.length <= length) return text;
  return `${text.slice(0, length - 3)}...\n[...${text.length - length + 3}文字省略]`;
}
