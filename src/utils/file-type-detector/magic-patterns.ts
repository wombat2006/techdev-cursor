import type { MagicNumberPattern } from './types';

export const MAGIC_PATTERNS: MagicNumberPattern[] = [
  // Executable formats (treated as unsupported for security)
  {
    pattern: [0x4D, 0x5A], // MZ header for PE executables
    offset: 0,
    fileType: {
      extension: '.bin',
      mimeType: 'application/octet-stream',
      encoding: 'binary',
      isSupported: false
    }
  },
  {
    pattern: [0x7F, 0x45, 0x4C, 0x46], // ELF header
    offset: 0,
    fileType: {
      extension: '.bin',
      mimeType: 'application/octet-stream',
      encoding: 'binary',
      isSupported: false
    }
  },
  {
    pattern: [0xCA, 0xFE, 0xBA, 0xBE], // Java class file
    offset: 0,
    fileType: {
      extension: '.bin',
      mimeType: 'application/octet-stream',
      encoding: 'binary',
      isSupported: false
    }
  },

  // PDF ファイル
  {
    pattern: [0x25, 0x50, 0x44, 0x46], // %PDF
    offset: 0,
    fileType: {
      extension: '.pdf',
      mimeType: 'application/pdf',
      encoding: 'base64',
      isSupported: true
    }
  },
  
  // Microsoft PowerPoint (.pptx) - ZIP-based
  {
    pattern: [0x50, 0x4B, 0x03, 0x04], // PK..
    offset: 0,
    fileType: {
      extension: '.pptx',
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // Microsoft Excel Binary (.xlsb) - ZIP-based (優先順位：詳細判別が必要なため先に配置)
  {
    pattern: [0x50, 0x4B, 0x03, 0x04], // PK..
    offset: 0,
    fileType: {
      extension: '.xlsb',
      mimeType: 'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // Microsoft Excel (.xlsx) - ZIP-based
  {
    pattern: [0x50, 0x4B, 0x03, 0x04], // PK..
    offset: 0,
    fileType: {
      extension: '.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // Microsoft Word (.docx) - ZIP-based
  {
    pattern: [0x50, 0x4B, 0x03, 0x04], // PK..
    offset: 0,
    fileType: {
      extension: '.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // Microsoft PowerPoint 97-2003 (.ppt) - OLE2
  {
    pattern: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], // OLE2 header
    offset: 0,
    fileType: {
      extension: '.ppt',
      mimeType: 'application/vnd.ms-powerpoint',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // Microsoft Excel 97-2003 (.xls) - OLE2
  {
    pattern: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], // OLE2 header
    offset: 0,
    fileType: {
      extension: '.xls',
      mimeType: 'application/vnd.ms-excel',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // Microsoft Word 97-2003 (.doc) - OLE2
  {
    pattern: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], // OLE2 header
    offset: 0,
    fileType: {
      extension: '.doc',
      mimeType: 'application/msword',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // Microsoft Excel Macro (.xlm) - OLE2
  {
    pattern: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], // OLE2 header
    offset: 0,
    fileType: {
      extension: '.xlm',
      mimeType: 'application/vnd.ms-excel',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // Apple iWork Pages
  {
    pattern: [0x50, 0x4B, 0x03, 0x04], // ZIP-based
    offset: 0,
    fileType: {
      extension: '.pages',
      mimeType: 'application/x-iwork-pages-sffpages',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // Apple iWork Numbers
  {
    pattern: [0x50, 0x4B, 0x03, 0x04], // ZIP-based
    offset: 0,
    fileType: {
      extension: '.numbers',
      mimeType: 'application/x-iwork-numbers-sffnumbers',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // Apple iWork Keynote
  {
    pattern: [0x50, 0x4B, 0x03, 0x04], // ZIP-based
    offset: 0,
    fileType: {
      extension: '.key',
      mimeType: 'application/x-iwork-keynote-sffkey',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // LibreOffice/OpenOffice Writer
  {
    pattern: [0x50, 0x4B, 0x03, 0x04], // ZIP-based
    offset: 0,
    fileType: {
      extension: '.odt',
      mimeType: 'application/vnd.oasis.opendocument.text',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // LibreOffice/OpenOffice Calc
  {
    pattern: [0x50, 0x4B, 0x03, 0x04], // ZIP-based
    offset: 0,
    fileType: {
      extension: '.ods',
      mimeType: 'application/vnd.oasis.opendocument.spreadsheet',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // LibreOffice/OpenOffice Impress
  {
    pattern: [0x50, 0x4B, 0x03, 0x04], // ZIP-based
    offset: 0,
    fileType: {
      extension: '.odp',
      mimeType: 'application/vnd.oasis.opendocument.presentation',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // 7-Zip アーカイブ
  {
    pattern: [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C], // 7z signature
    offset: 0,
    fileType: {
      extension: '.7z',
      mimeType: 'application/x-7z-compressed',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // RAR アーカイブ
  {
    pattern: [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x00], // Rar!
    offset: 0,
    fileType: {
      extension: '.rar',
      mimeType: 'application/x-rar-compressed',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // RAR v5 アーカイブ
  {
    pattern: [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x01, 0x00], // Rar!... (v5)
    offset: 0,
    fileType: {
      extension: '.rar',
      mimeType: 'application/x-rar-compressed',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // GZIP アーカイブ
  {
    pattern: [0x1F, 0x8B], // GZ signature
    offset: 0,
    fileType: {
      extension: '.gz',
      mimeType: 'application/gzip',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // XZ アーカイブ
  {
    pattern: [0xFD, 0x37, 0x7A, 0x58, 0x5A, 0x00], // XZ signature
    offset: 0,
    fileType: {
      extension: '.xz',
      mimeType: 'application/x-xz',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // TAR アーカイブ (ustar magic)
  {
    pattern: [0x75, 0x73, 0x74, 0x61, 0x72], // ustar
    offset: 257,
    fileType: {
      extension: '.tar',
      mimeType: 'application/x-tar',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // LZH アーカイブ
  {
    pattern: [0x2D, 0x6C, 0x68], // -lh
    offset: 2,
    fileType: {
      extension: '.lzh',
      mimeType: 'application/x-lzh-compressed',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // PNG 画像
  {
    pattern: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], // PNG signature
    offset: 0,
    minLength: 4,
    fileType: {
      extension: '.png',
      mimeType: 'image/png',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // JPEG 画像
  {
    pattern: [0xFF, 0xD8, 0xFF], // JPEG SOI
    offset: 0,
    fileType: {
      extension: '.jpg',
      mimeType: 'image/jpeg',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // JPEG 2000 (.j2k/.jp2)
  {
    pattern: [0x00, 0x00, 0x00, 0x0C, 0x6A, 0x50, 0x20, 0x20], // JP2 signature
    offset: 0,
    fileType: {
      extension: '.j2k',
      mimeType: 'image/jp2',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // MP4 動画
  {
    pattern: [0x66, 0x74, 0x79, 0x70], // ftyp
    offset: 4,
    fileType: {
      extension: '.mp4',
      mimeType: 'video/mp4',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // MPEG 動画
  {
    pattern: [0x00, 0x00, 0x01, 0xBA], // MPEG-PS
    offset: 0,
    fileType: {
      extension: '.mpg',
      mimeType: 'video/mpeg',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // MP3 音声 (ID3v2)
  {
    pattern: [0x49, 0x44, 0x33], // ID3
    offset: 0,
    fileType: {
      extension: '.mp3',
      mimeType: 'audio/mpeg',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // MP3 音声 (MPEG Audio)
  {
    pattern: [0xFF, 0xFB], // MPEG-1 Layer 3
    offset: 0,
    fileType: {
      extension: '.mp3',
      mimeType: 'audio/mpeg',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // EPUB ebook
  {
    pattern: [0x50, 0x4B, 0x03, 0x04], // ZIP-based
    offset: 0,
    fileType: {
      extension: '.epub',
      mimeType: 'application/epub+zip',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // SQLite Database
  {
    pattern: [0x53, 0x51, 0x4C, 0x69, 0x74, 0x65, 0x20, 0x66, 0x6F, 0x72, 0x6D, 0x61, 0x74, 0x20, 0x33], // "SQLite format 3"
    offset: 0,
    fileType: {
      extension: '.sqlite',
      mimeType: 'application/x-sqlite3',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // ZIP アーカイブ
  {
    pattern: [0x50, 0x4B, 0x03, 0x04], // PK..
    offset: 0,
    fileType: {
      extension: '.zip',
      mimeType: 'application/zip',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // PEM 証明書/秘密鍵
  {
    pattern: [0x2D, 0x2D, 0x2D, 0x2D, 0x2D, 0x42, 0x45, 0x47, 0x49, 0x4E], // -----BEGIN
    offset: 0,
    fileType: {
      extension: '.pem',
      mimeType: 'application/x-pem-file',
      encoding: 'utf8',
      isSupported: true
    }
  },
  
  // DER エンコード証明書
  {
    pattern: [0x30, 0x82], // ASN.1 SEQUENCE
    offset: 0,
    fileType: {
      extension: '.crt',
      mimeType: 'application/x-x509-ca-cert',
      encoding: 'binary',
      isSupported: true
    }
  },
  
  // P7B/P7C 証明書チェーン
  {
    pattern: [0x30, 0x80], // ASN.1 SEQUENCE (indefinite length)
    offset: 0,
    fileType: {
      extension: '.p7b',
      mimeType: 'application/x-pkcs7-certificates',
      encoding: 'binary',
      isSupported: true
    }
  }
];

/**
 * バッファからファイル形式を検出
 */

export function matchesPattern(buffer: Buffer, pattern: MagicNumberPattern): boolean {
  const requiredLength = pattern.offset + (pattern.minLength ?? pattern.pattern.length);
  if (buffer.length < requiredLength) {
    return false;
  }

  const availableLength = buffer.length - pattern.offset;
  const compareLength = Math.min(pattern.pattern.length, availableLength);

  for (let i = 0; i < compareLength; i++) {
    if (buffer[pattern.offset + i] !== pattern.pattern[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Office文書の詳細判別（ZIP内のファイル構造確認）
 */
