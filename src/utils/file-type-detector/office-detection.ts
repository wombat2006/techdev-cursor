import type { FileTypeInfo } from './types';

export function isZipBasedOfficeFormat(extension: string): boolean {
  return ['.xlsx', '.xlsb', '.docx', '.pptx', '.pages', '.numbers', '.key', '.odt', '.ods', '.odp', '.epub'].includes(extension);
}

/**
 * OLE2形式ベースのOffice文書かチェック
 */
export function isOLE2BasedOfficeFormat(extension: string): boolean {
  return ['.xls', '.xlm', '.doc', '.ppt'].includes(extension);
}

/**
 * EPUBファイルの詳細判別
 */
export function isEpubFile(buffer: Buffer): boolean {
  try {
    const content = buffer.toString('binary', 0, Math.min(512, buffer.length));
    return content.includes('META-INF/container.xml') || content.includes('mimetype') || content.includes('application/epub+zip');
  } catch (error) {
    return false;
  }
}

export function isOfficeFile(buffer: Buffer, type: 'xlsx' | 'docx' | 'pptx' | 'xlsb' | 'pages' | 'numbers' | 'key' | 'odt' | 'ods' | 'odp'): boolean {
  try {
    // ZIP内のファイル名を簡易チェック
    const content = buffer.toString('binary', 0, Math.min(2048, buffer.length));
    
    switch (type) {
      case 'xlsx':
        // Excel固有のファイル構造を確認
        return content.includes('xl/') || content.includes('worksheets/') || content.includes('xl/workbook.xml');
      
      case 'xlsb':
        // Excel Binary固有のファイル構造を確認
        return content.includes('xl/') && (content.includes('workbook.bin') || content.includes('binaryIndex') || content.includes('.bin'));
      
      case 'docx':
        // Word固有のファイル構造を確認
        return content.includes('word/') || content.includes('document.xml') || content.includes('word/document.xml');
      
      case 'pptx':
        // PowerPoint固有のファイル構造を確認
        return content.includes('ppt/') || content.includes('slides/') || content.includes('ppt/presentation.xml');
      
      case 'pages':
        // Apple Pages固有のファイル構造を確認
        return content.includes('index.xml') && content.includes('preview.jpg');
      
      case 'numbers':
        // Apple Numbers固有のファイル構造を確認
        return content.includes('index.xml') && (content.includes('Tables/') || content.includes('Metadata/'));
      
      case 'key':
        // Apple Keynote固有のファイル構造を確認
        return content.includes('index.xml') && content.includes('Data/');
      
      case 'odt':
        // OpenDocument Text固有のファイル構造を確認
        return content.includes('content.xml') && content.includes('meta.xml') && content.includes('mimetype');
      
      case 'ods':
        // OpenDocument Spreadsheet固有のファイル構造を確認
        return content.includes('content.xml') && content.includes('meta.xml') && content.includes('mimetype');
      
      case 'odp':
        // OpenDocument Presentation固有のファイル構造を確認
        return content.includes('content.xml') && content.includes('meta.xml') && content.includes('mimetype');
      
      default:
        return false;
    }
  } catch (error) {
    // ZIP構造解析エラーの場合は基本判定を使用
  }
  
  return false;
}

/**
 * OLE2文書の詳細判別（OLE内のストリーム構造確認）
 */
export function isOLEOfficeFile(buffer: Buffer, type: 'xls' | 'doc' | 'ppt' | 'xlm'): boolean {
  try {
    // OLE2構造の簡易チェック（最初の1KBをバイナリ検索）
    const content = buffer.toString('binary', 0, Math.min(1024, buffer.length));
    
    switch (type) {
      case 'xls':
      case 'xlm':
        // Excel固有のOLE2ストリーム確認
        return content.includes('Workbook') || content.includes('Book') || content.includes('\u0005\u0000');
      
      case 'doc':
        // Word固有のOLE2ストリーム確認
        return content.includes('WordDocument') || content.includes('\u0009\u0008') || content.includes('Microsoft');
      
      case 'ppt':
        // PowerPoint固有のOLE2ストリーム確認
        return content.includes('PowerPoint') || content.includes('\u000F\u0000') || content.includes('Current User');
      
      default:
        return false;
    }
  } catch (error) {
    // OLE2構造解析エラーの場合は基本判定を使用
  }
  
  return false;
}

/**
 * テキストファイル判定
 */
