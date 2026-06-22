export interface GoogleDriveConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
}

export interface OpenAIConfig {
  apiKey: string;
  organization?: string;
}

export interface DocumentMetadata {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  modifiedTime: string;
  webViewLink: string;
}

export interface ProcessedDocument {
  id: string;
  name: string;
  content: string | Buffer;
  metadata: DocumentMetadata;
  vectorStoreFileId?: string;
}
