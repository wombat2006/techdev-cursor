export interface WebhookNotification {
  kind: string;
  id: string;
  resourceId: string;
  resourceUri: string;
  token: string;
  expiration: number;
}

export interface DriveChangeEvent {
  kind: string;
  changeId: string;
  time: string;
  removed: boolean;
  fileId: string;
  file?: DriveFileRef;
}

export interface DriveFileRef {
  id: string;
  name: string;
  mimeType: string;
  parents: string[];
  modifiedTime: string;
}

export interface WebhookHandlerStats {
  monitoredFoldersCount: number;
  supportedMimeTypes: string[];
  isInitialized: boolean;
}
