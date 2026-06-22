import type { FileTypeInfo } from './types';
import { MAGIC_PATTERNS, matchesPattern } from './magic-patterns';
import { isEpubFile, isOfficeFile, isOLEOfficeFile, isZipBasedOfficeFormat, isOLE2BasedOfficeFormat } from './office-detection';
import { detectTextFileType, isTextFile } from './text-detection';
import { redactSensitiveContent } from '../security';

export function detectFileType(buffer: Buffer): FileTypeInfo {
  // マジックナンバーチェック
  for (const pattern of MAGIC_PATTERNS) {
    if (matchesPattern(buffer, pattern)) {
      // ZIP-baseファイル（Office系）の詳細判別
      if (pattern.fileType.extension === '.xlsx' && isOfficeFile(buffer, 'xlsx')) {
        return pattern.fileType;
      } else if (pattern.fileType.extension === '.xlsb' && isOfficeFile(buffer, 'xlsb')) {
        return pattern.fileType;
      } else if (pattern.fileType.extension === '.docx' && isOfficeFile(buffer, 'docx')) {
        return pattern.fileType;
      } else if (pattern.fileType.extension === '.pptx' && isOfficeFile(buffer, 'pptx')) {
        return pattern.fileType;
      } else if (pattern.fileType.extension === '.pages' && isOfficeFile(buffer, 'pages')) {
        return pattern.fileType;
      } else if (pattern.fileType.extension === '.numbers' && isOfficeFile(buffer, 'numbers')) {
        return pattern.fileType;
      } else if (pattern.fileType.extension === '.key' && isOfficeFile(buffer, 'key')) {
        return pattern.fileType;
      } else if (pattern.fileType.extension === '.odt' && isOfficeFile(buffer, 'odt')) {
        return pattern.fileType;
      } else if (pattern.fileType.extension === '.ods' && isOfficeFile(buffer, 'ods')) {
        return pattern.fileType;
      } else if (pattern.fileType.extension === '.odp' && isOfficeFile(buffer, 'odp')) {
        return pattern.fileType;
      } else if (pattern.fileType.extension === '.epub' && isEpubFile(buffer)) {
        return pattern.fileType;
      }
      // OLE2-baseファイル（レガシーOffice系）の詳細判別
      else if (pattern.fileType.extension === '.xls' && isOLEOfficeFile(buffer, 'xls')) {
        return pattern.fileType;
      } else if (pattern.fileType.extension === '.xlm' && isOLEOfficeFile(buffer, 'xlm')) {
        return pattern.fileType;
      } else if (pattern.fileType.extension === '.doc' && isOLEOfficeFile(buffer, 'doc')) {
        return pattern.fileType;
      } else if (pattern.fileType.extension === '.ppt' && isOLEOfficeFile(buffer, 'ppt')) {
        return pattern.fileType;
      }
      // ZIP/OLE2ベースではない形式（PDF、アーカイブ、メディアファイル等）
      else if (!isZipBasedOfficeFormat(pattern.fileType.extension) && 
               !isOLE2BasedOfficeFormat(pattern.fileType.extension)) {
        return pattern.fileType;
      }
    }
  }

  if (buffer.length < 4) {
    return {
      extension: '.bin',
      mimeType: 'application/octet-stream',
      encoding: 'binary',
      isSupported: false
    };
  }

  // 特殊なテキスト形式の検出
  const textFileType = detectTextFileType(buffer);
  if (textFileType) {
    return textFileType;
  }
  
  // テキストファイル判定（汎用）
  if (isTextFile(buffer)) {
    return {
      extension: '.txt',
      mimeType: 'text/plain',
      encoding: 'utf8',
      isSupported: true
    };
  }
  
  // 不明なファイル形式
  return {
    extension: '.bin',
    mimeType: 'application/octet-stream',
    encoding: 'binary',
    isSupported: false
  };
}

export function isSupportedFileType(fileType: FileTypeInfo): boolean {
  return fileType.isSupported;
}

/**
 * デバッグ用：バッファの最初の32バイトを16進数で表示
 */
export function debugMagicNumber(buffer: Buffer): string {
  const size = Math.min(32, buffer.length);
  const hex = Array.from(buffer.slice(0, size))
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ');
  const ascii = Array.from(buffer.slice(0, size))
    .map(b => (b >= 0x20 && b <= 0x7E) ? String.fromCharCode(b) : '.')
    .join('');

  const sanitizedAscii = redactSensitiveContent(ascii);

  return `HEX: ${hex}\nASCII: ${sanitizedAscii}`;
}
