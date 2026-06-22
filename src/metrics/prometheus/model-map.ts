export function getModelByProvider(provider: string): string {
  const modelMap: { [key: string]: string } = {
    'Gemini': 'gemini-2.5-pro',
    'OpenAI': 'gpt-5',
    'Claude': 'claude-3-5-sonnet-latest',
    'OpenRouter': 'meta-llama/llama-3.1-405b-instruct'
  };
  return modelMap[provider] || 'unknown';
}
