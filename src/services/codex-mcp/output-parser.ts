export function parseMCPResponses(
  data: string,
  events: any[],
  onResponse: (response: string) => void
): void {
  const lines = data.split('\n');

  for (const line of lines) {
    if (line.trim()) {
      try {
        const jsonResponse = JSON.parse(line);

        if (jsonResponse.method === 'codex/event') {
          events.push(jsonResponse.params);
        } else if (jsonResponse.id && jsonResponse.result) {
          if (jsonResponse.result.content && jsonResponse.result.content[0]) {
            onResponse(jsonResponse.result.content[0].text);
          }
        }
      } catch (e) {
        // Ignore non-JSON lines
      }
    }
  }
}

/**
 * Parse JSON output from Codex non-interactive mode
 */
export function parseJSONOutput(
  data: string,
  events: any[],
  onResponse: (response: string) => void
): void {
  const lines = data.split('\n');

  for (const line of lines) {
    if (line.trim().startsWith('{"id":')) {
      try {
        const jsonData = JSON.parse(line);
        events.push(jsonData);

        if (jsonData.msg && jsonData.msg.type === 'agent_message' && jsonData.msg.message) {
          onResponse(jsonData.msg.message);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }
}
