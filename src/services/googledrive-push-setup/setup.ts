import type { GoogleDriveConfig } from '../googledrive-connector/types';
import { cleanupExpiredChannels, listActiveChannels } from './channel-maintenance';
import {
  renewPushChannel,
  setupFilePushNotifications,
  setupFolderChangeNotifications,
  stopPushChannel,
} from './channel-operations';
import { createGoogleDrivePushContext, type GoogleDrivePushContext } from './drive-context';
import { quickSetupPushNotifications } from './quick-setup';
import { testPushNotificationSetup } from './setup-diagnostics';
import type { PushChannelResponse } from './types';

export class GoogleDrivePushSetup {
  private readonly ctx: GoogleDrivePushContext;

  constructor(googleDriveConfig: GoogleDriveConfig, baseUrl?: string) {
    this.ctx = createGoogleDrivePushContext(googleDriveConfig, baseUrl);
  }

  async setupFilePushNotifications(
    folderId: string,
    ttlHours: number = 24 * 7
  ): Promise<PushChannelResponse> {
    return setupFilePushNotifications(this.ctx, folderId, ttlHours);
  }

  async setupFolderChangeNotifications(
    ttlHours: number = 24 * 7
  ): Promise<PushChannelResponse> {
    return setupFolderChangeNotifications(this.ctx, ttlHours);
  }

  async renewPushChannel(
    channelId: string,
    resourceId: string,
    ttlHours: number = 24 * 7
  ): Promise<PushChannelResponse> {
    return renewPushChannel(this.ctx, channelId, resourceId, ttlHours);
  }

  async stopPushChannel(channelId: string, resourceId: string): Promise<void> {
    return stopPushChannel(this.ctx, channelId, resourceId);
  }

  async listActiveChannels() {
    return listActiveChannels();
  }

  async cleanupExpiredChannels() {
    return cleanupExpiredChannels(this.ctx);
  }

  async testPushNotificationSetup() {
    return testPushNotificationSetup(this.ctx);
  }

  async quickSetup(folderId?: string, ttlHours: number = 24 * 7) {
    return quickSetupPushNotifications(this.ctx, folderId, ttlHours);
  }
}

export default GoogleDrivePushSetup;
