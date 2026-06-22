/**
 * File Type Detection Utility
 * マジックナンバーを使用した正確なファイル形式判別
 */

export interface FileTypeInfo {
  extension: string;
  mimeType: string;
  encoding: 'binary' | 'utf8' | 'base64';
  isSupported: boolean;
}

export interface MagicNumberPattern {
  pattern: number[];
  offset: number;
  fileType: FileTypeInfo;
  minLength?: number;
}

