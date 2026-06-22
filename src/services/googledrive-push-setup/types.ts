export interface PushChannelConfig {
  id: string;
  type: string;
  address: string;
  token?: string;
  expiration?: number;
  params?: {
    ttl?: number;
  };
}

export interface PushChannelResponse {
  kind: string;
  id: string;
  resourceId: string;
  resourceUri: string;
  token?: string;
  expiration: number;
}

export interface StoredPushChannel {
  id: string;
  resourceId: string;
  expiration: number;
}

export interface ActiveChannelSummary {
  id: string;
  resourceId: string;
  expiration: Date;
  isExpired: boolean;
}

export interface PushSetupTestResult {
  name: string;
  status: 'passed' | 'failed';
  details?: unknown;
  error?: string;
}
