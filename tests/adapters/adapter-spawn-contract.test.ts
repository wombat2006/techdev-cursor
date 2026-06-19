import { EventEmitter } from 'events';
import { ClaudeAdapter } from '../../src/adapters/claude-adapter';
import { CodexAdapter } from '../../src/adapters/codex-adapter';
import { AgyAdapter } from '../../src/adapters/agy-adapter';

const mockSpawn = jest.fn();
const mockExecuteAgyPrint = jest.fn();

jest.mock('child_process', () => ({
  spawn: (...args: unknown[]) => mockSpawn(...args),
}));

jest.mock('../../src/utils/antigravity-cli', () => ({
  executeAgyPrint: (...args: unknown[]) => mockExecuteAgyPrint(...args),
}));

function mockSpawnSuccess(stdout = 'ok'): void {
  mockSpawn.mockImplementation(() => {
    const child = new EventEmitter() as EventEmitter & {
      stdin: { write: jest.Mock; end: jest.Mock };
      stdout: EventEmitter;
      stderr: EventEmitter;
      kill: jest.Mock;
    };
    child.stdin = { write: jest.fn(), end: jest.fn() };
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.kill = jest.fn();
    process.nextTick(() => {
      child.stdout.emit('data', Buffer.from(stdout));
      child.emit('close', 0);
    });
    return child;
  });
}

describe('adapter spawn contract (Contract Layer)', () => {
  beforeEach(() => {
    mockSpawn.mockReset();
    mockExecuteAgyPrint.mockReset();
    mockSpawnSuccess();
    mockExecuteAgyPrint.mockResolvedValue({ content: 'ok', stderr: '' });
  });

  it('claude adapter passes --model and --effort to CLI', async () => {
    const adapter = new ClaudeAdapter();
    await adapter.invoke({
      prompt: 'hi',
      profile: { model: 'sonnet', effort: 'medium', cot: 'off' },
    });

    expect(mockSpawn).toHaveBeenCalledWith(
      'claude',
      expect.arrayContaining(['--print', '--model', 'sonnet', '--effort', 'medium']),
      expect.objectContaining({ stdio: ['pipe', 'pipe', 'pipe'] })
    );
  });

  it('codex adapter passes --model to codex exec', async () => {
    const adapter = new CodexAdapter();
    await adapter.invoke({
      prompt: 'hi',
      profile: { model: 'gpt-5.5', cot: 'off' },
    });

    expect(mockSpawn).toHaveBeenCalledWith(
      'codex',
      expect.arrayContaining(['exec', '--model', 'gpt-5.5', '--skip-git-repo-check']),
      expect.any(Object)
    );
  });

  it('agy adapter passes model to executeAgyPrint', async () => {
    const adapter = new AgyAdapter();
    await adapter.invoke({
      prompt: 'hi',
      profile: { model: 'gemini-2.5-flash', cot: 'off' },
      workingDirectory: '/tmp',
    });

    expect(mockExecuteAgyPrint).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ model: 'gemini-2.5-flash', cwd: '/tmp' })
    );
  });
});
