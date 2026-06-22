import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import OpenAI from 'openai';
import { downloadDocument } from './download-document';
import { listDocuments } from './list-documents';
import { searchRAG, searchWithMCP } from './rag-search';
import { syncDocumentsById, syncFolderToRAG } from './sync-operations';
import type { GoogleDriveConfig, OpenAIConfig, ProcessedDocument } from './types';
import {
  addDocumentToVectorStore,
  getOrCreateVectorStore,
  removeDocumentFromVectorStore,
} from './vector-store';

export class GoogleDriveRAGConnector {
  private drive: any;
  private openai: OpenAI;
  private oauth2Client: OAuth2Client;

  constructor(
    private googleDriveConfig: GoogleDriveConfig,
    private openaiConfig: OpenAIConfig
  ) {
    this.oauth2Client = new OAuth2Client(
      googleDriveConfig.clientId,
      googleDriveConfig.clientSecret,
      googleDriveConfig.redirectUri
    );

    this.oauth2Client.setCredentials({
      refresh_token: googleDriveConfig.refreshToken,
    });

    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });

    this.openai = new OpenAI({
      apiKey: openaiConfig.apiKey,
      organization: openaiConfig.organization,
    });
  }

  private syncOps() {
    return {
      drive: this.drive,
      openai: this.openai,
      listDocuments,
      downloadDocument,
      getOrCreateVectorStore,
      addDocumentToVectorStore,
    };
  }

  listDocuments(
    folderId?: string,
    mimeTypes?: string[]
  ) {
    return listDocuments(this.drive, folderId, mimeTypes);
  }

  downloadDocument(documentId: string) {
    return downloadDocument(this.drive, documentId);
  }

  getOrCreateVectorStore(name: string) {
    return getOrCreateVectorStore(this.openai, name);
  }

  addDocumentToVectorStore(vectorStoreId: string, document: ProcessedDocument) {
    return addDocumentToVectorStore(this.openai, vectorStoreId, document);
  }

  removeDocumentFromVectorStore(vectorStoreId: string, vectorStoreFileId: string) {
    return removeDocumentFromVectorStore(this.openai, vectorStoreId, vectorStoreFileId);
  }

  syncFolderToRAG(folderId: string, vectorStoreName: string, batchSize?: number) {
    return syncFolderToRAG(this.syncOps(), folderId, vectorStoreName, batchSize);
  }

  syncDocumentsById(documentIds: string[], vectorStoreName: string) {
    return syncDocumentsById(this.syncOps(), documentIds, vectorStoreName);
  }

  searchRAG(query: string, vectorStoreId?: string, maxResults?: number) {
    return searchRAG(this.openai, query, vectorStoreId, maxResults);
  }

  searchWithMCP(
    query: string,
    options?: { searchRecent?: boolean; maxResults?: number; fileTypes?: string[] }
  ) {
    return searchWithMCP(this.openai, query, options);
  }
}

export default GoogleDriveRAGConnector;
