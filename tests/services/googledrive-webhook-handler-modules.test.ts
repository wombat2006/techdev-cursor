import { parseWebhookNotification } from '../../src/services/googledrive-webhook-handler/context';
import {
  isSupportedRagMimeType,
  SUPPORTED_RAG_MIME_TYPES,
} from '../../src/services/googledrive-webhook-handler/supported-mime-types';
import { verifyWebhookSignature } from '../../src/services/googledrive-webhook-handler/signature-verification';

describe('googledrive-webhook-handler SRP modules', () => {
  describe('shim exports', () => {
    it('re-exports GoogleDriveWebhookHandler from shim path', async () => {
      const mod = await import('../../src/services/googledrive-webhook-handler');
      expect(mod.GoogleDriveWebhookHandler).toBeDefined();
      expect(mod.default).toBe(mod.GoogleDriveWebhookHandler);
    });
  });

  describe('supported-mime-types', () => {
    it('isSupportedRagMimeType accepts pdf and rejects unknown', () => {
      expect(isSupportedRagMimeType('application/pdf')).toBe(true);
      expect(isSupportedRagMimeType('application/octet-stream')).toBe(false);
      expect(SUPPORTED_RAG_MIME_TYPES.length).toBeGreaterThan(0);
    });
  });

  describe('signature-verification', () => {
    it('verifyWebhookSignature allows missing signature in development', () => {
      const req = {
        headers: {},
        body: {},
      } as never;

      expect(verifyWebhookSignature(req, 'secret', 'development')).toBe(true);
      expect(verifyWebhookSignature(req, 'secret', 'production')).toBe(false);
    });
  });

  describe('notification parser', () => {
    it('parseWebhookNotification maps Google channel headers', () => {
      const req = {
        headers: {
          'x-goog-channel-id': 'channel-1',
          'x-goog-resource-id': 'resource-1',
          'x-goog-resource-uri': 'https://example.com',
          'x-goog-channel-token': 'tok',
          'x-goog-channel-expiration': '123',
          'x-goog-resource-state': 'update',
        },
      } as never;

      const parsed = parseWebhookNotification(req);
      expect(parsed.notification.id).toBe('channel-1');
      expect(parsed.resourceState).toBe('update');
      expect(parsed.notification.expiration).toBe(123);
    });
  });
});
