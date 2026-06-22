import type { FileTypeInfo } from './types';

export function detectTextFileType(buffer: Buffer): FileTypeInfo | null {
  const previewLength = Math.min(4096, buffer.length);
  const preview = buffer.toString('utf8', 0, previewLength);
  const trimmedPreview = preview.trimStart();

  // RTF ファイル
  if (trimmedPreview.startsWith('{\\rtf')) {
    return {
      extension: '.rtf',
      mimeType: 'text/rtf',
      encoding: 'utf8',
      isSupported: true
    };
  }

  // JSON ファイル
  if (trimmedPreview.startsWith('{') || trimmedPreview.startsWith('[')) {
    const fullContent = buffer.toString('utf8').trim();

    if (hasMatchingJsonBoundary(fullContent)) {
      try {
        JSON.parse(fullContent);
        return {
          extension: '.json',
          mimeType: 'application/json',
          encoding: 'utf8',
          isSupported: true
        };
      } catch {
        // JSON Parse エラーは無視
      }
    }
  }

  // YAML ファイル
  if (preview.includes('---\n') || preview.match(/^[a-zA-Z_][a-zA-Z0-9_]*:\s/m)) {
    return {
      extension: '.yml',
      mimeType: 'application/x-yaml',
      encoding: 'utf8',
      isSupported: true
    };
  }

  // TSV ファイル（タブ区切り）
  const lines = preview.split('\n').slice(0, 5); // 最初の5行をチェック
  const tabCount = lines.filter(line => line.includes('\t')).length;
  if (tabCount >= 2 && tabCount / lines.length > 0.5) {
    return {
      extension: '.tsv',
      mimeType: 'text/tab-separated-values',
      encoding: 'utf8',
      isSupported: true
    };
  }

  // C言語ソースファイル
  if (preview.includes('#include') && (preview.includes('int main') || preview.includes('void ') || preview.includes('return '))) {
    return {
      extension: '.c',
      mimeType: 'text/x-csrc',
      encoding: 'utf8',
      isSupported: true
    };
  }

  // C++ ソースファイル
  if (preview.includes('#include') && (preview.includes('std::') || preview.includes('namespace') || preview.includes('class '))) {
    return {
      extension: '.cpp',
      mimeType: 'text/x-c++src',
      encoding: 'utf8',
      isSupported: true
    };
  }

  // JavaScript ファイル
  if (preview.includes('function') && (preview.includes('var ') || preview.includes('let ') || preview.includes('const '))) {
    return {
      extension: '.js',
      mimeType: 'text/javascript',
      encoding: 'utf8',
      isSupported: true
    };
  }
  
  // Python ファイル
  if (preview.includes('def ') && (preview.includes('import ') || preview.includes('from ') || preview.includes('if __name__'))) {
    return {
      extension: '.py',
      mimeType: 'text/x-python',
      encoding: 'utf8',
      isSupported: true
    };
  }
  
  // Shell スクリプト
  if (trimmedPreview.startsWith('#!/bin/bash') || trimmedPreview.startsWith('#!/bin/sh') || trimmedPreview.startsWith('#!/usr/bin/env')) {
    return {
      extension: '.sh',
      mimeType: 'text/x-shellscript',
      encoding: 'utf8',
      isSupported: true
    };
  }
  
  // SQL ファイル
  const upperPreview = preview.toUpperCase();
  if (upperPreview.includes('SELECT') || upperPreview.includes('CREATE TABLE') || upperPreview.includes('INSERT INTO')) {
    return {
      extension: '.sql',
      mimeType: 'text/x-sql',
      encoding: 'utf8',
      isSupported: true
    };
  }
  
  // CSV ファイル
  const commaCount = lines.filter(line => line.includes(',')).length;
  if (commaCount >= 2 && commaCount / lines.length > 0.6) {
    return {
      extension: '.csv',
      mimeType: 'text/csv',
      encoding: 'utf8',
      isSupported: true
    };
  }
  
  return null;
}

export function hasMatchingJsonBoundary(content: string): boolean {
  if (!content) {
    return false;
  }

  const firstChar = content[0];
  const lastChar = content[content.length - 1];

  if (firstChar === '{') {
    return lastChar === '}';
  }

  if (firstChar === '[') {
    return lastChar === ']';
  }

  return false;
}

export function getUtf8SequenceLength(firstByte: number): number {
  if ((firstByte & 0b10000000) === 0) {
    return 1;
  }

  if ((firstByte & 0b11100000) === 0b11000000 && firstByte >= 0xC2 && firstByte <= 0xDF) {
    return 2;
  }

  if ((firstByte & 0b11110000) === 0b11100000 && firstByte <= 0xEF) {
    return 3;
  }

  if ((firstByte & 0b11111000) === 0b11110000 && firstByte <= 0xF4) {
    return 4;
  }

  return 0;
}

export function isTextFile(buffer: Buffer): boolean {
  if (buffer.length === 0) {
    return true;
  }

  const sampleSize = Math.min(4096, buffer.length);
  const sample = buffer.slice(0, sampleSize);

  let textBytes = 0;
  let index = 0;

  while (index < sample.length) {
    const byte = sample[index];

    if ((byte >= 0x20 && byte <= 0x7E) || byte === 0x09 || byte === 0x0A || byte === 0x0D) {
      textBytes++;
      index++;
      continue;
    }

    if (byte === 0x00) {
      return false;
    }

    const sequenceLength = getUtf8SequenceLength(byte);
    if (sequenceLength > 1) {
      if (index + sequenceLength > sample.length) {
        break;
      }

      let isValidSequence = true;
      for (let i = 1; i < sequenceLength; i++) {
        const continuationByte = sample[index + i];
        if ((continuationByte & 0b11000000) !== 0b10000000) {
          isValidSequence = false;
          break;
        }
      }

      if (isValidSequence) {
        textBytes += sequenceLength;
        index += sequenceLength;
        continue;
      }
    }

    index++;
  }

  return (textBytes / sample.length) > 0.8;
}
