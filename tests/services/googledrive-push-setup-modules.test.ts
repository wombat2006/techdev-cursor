import {
  buildChangesChannelConfig,
  buildFileChannelConfig,
  buildWebhookNotificationUrl,
  GOOGLEDRIVE_WEBHOOK_PATH,
  isWebhookUrlValidForEnvironment,
} from '../../src/services/googledrive-push-setup/channel-config';
import {
  getStoredChannels,
  saveChannelInfo,
} from '../../src/services/googledrive-push-setup/channel-storage';
import { generateSecureToken } from '../../src/services/googledrive-push-setup/token-utils';
import { listActiveChannels } from '../../src/services/googledrive-push-setup/channel-maintenance';

describe('googledrive-push-setup SRP modules', () => {
  describe('shim exports', () => {
    it('re-exports GoogleDrivePushSetup from shim path', async () => {
      const mod = await import('../../src/services/googledrive-push-setup');
      expect(mod.GoogleDrivePushSetup).toBeDefined();
      expect(mod.default).toBe(mod.GoogleDrivePushSetup);
    });
  });

  describe('channel-config', () => {
    it('buildWebhookNotificationUrl appends webhook path', () => {
      expect(buildWebhookNotificationUrl('https://example.com')).toBe(
        `https://example.com${GOOGLEDRIVE_WEBHOOK_PATH}`
      );
    });

    it('buildFileChannelConfig includes folder id and ttl params', () => {
      const config = buildFileChannelConfig('folder-1', 'https://example.com', 'tok', 24);
      expect(config.id).toContain('techsapo-files-folder-1');
      expect(config.address).toContain(GOOGLEDRIVE_WEBHOOK_PATH);
      expect(config.params?.ttl).toBe(24 * 3600);
      expect(config.token).toBe('tok');
    });

    it('buildChangesChannelConfig uses changes channel prefix', () => {
      const config = buildChangesChannelConfig('https://example.com', 'tok', 48);
      expect(config.id).toContain('techsapo-changes-');
      expect(config.expiration).toBeGreaterThan(Date.now());
    });

    it('isWebhookUrlValidForEnvironment requires https outside development', () => {
      expect(isWebhookUrlValidForEnvironment('https://x.com/hook', 'production')).toBe(true);
      expect(isWebhookUrlValidForEnvironment('http://x.com/hook', 'production')).toBe(false);
      expect(isWebhookUrlValidForEnvironment('http://localhost/hook', 'development')).toBe(true);
    });
  });

  describe('token-utils', () => {
    it('generateSecureToken returns 64-char hex string', () => {
      const token = generateSecureToken();
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('channel-storage', () => {
    it('getStoredChannels parses env JSON', () => {
      const channels = getStoredChannels(() =>
        JSON.stringify([{ id: 'c1', resourceId: 'r1', expiration: 1 }])
      );
      expect(channels).toHaveLength(1);
      expect(channels[0].id).toBe('c1');
    });

    it('saveChannelInfo appends to stored channels', () => {
      const env = new Map<string, string>([['GOOGLEDRIVE_PUSH_CHANNELS', '[]']]);
      saveChannelInfo(
        {
          kind: 'api#channel',
          id: 'new-id',
          resourceId: 'res-1',
          resourceUri: 'uri',
          expiration: 999,
        },
        (key) => env.get(key),
        (key, value) => env.set(key, value)
      );
      const stored = JSON.parse(env.get('GOOGLEDRIVE_PUSH_CHANNELS') || '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe('new-id');
    });
  });

  describe('channel-maintenance', () => {
    it('listActiveChannels marks expired channels', async () => {
      const past = Date.now() - 1000;
      const future = Date.now() + 60_000;
      const result = await listActiveChannels(() =>
        JSON.stringify([
          { id: 'old', resourceId: 'r-old', expiration: past },
          { id: 'new', resourceId: 'r-new', expiration: future },
        ])
      );
      expect(result.totalCount).toBe(2);
      expect(result.expiredCount).toBe(1);
      expect(result.channels.find((c) => c.id === 'old')?.isExpired).toBe(true);
    });
  });
});
