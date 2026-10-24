import fs from 'node:fs';
import path from 'node:path';
import { fileTypeFromFile } from 'file-type';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import { FileCategory, FileItem } from '../../shared/types';

const EXTENSION_CATEGORY_MAP: Record<string, FileCategory> = {
  // Images
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  webp: 'image',
  avif: 'image',
  gif: 'image',
  tiff: 'image',
  tif: 'image',
  bmp: 'image',
  svg: 'image',
  ico: 'image',
  heic: 'image',
  heif: 'image',

  // PDF
  pdf: 'pdf',

  // Video
  mp4: 'video',
  mkv: 'video',
  mov: 'video',
  avi: 'video',
  webm: 'video',
  wmv: 'video',
  flv: 'video',
  m4v: 'video',

  // Audio
  mp3: 'audio',
  wav: 'audio',
  flac: 'audio',
  aac: 'audio',
  ogg: 'audio',
  m4a: 'audio',
  opus: 'audio',
  wma: 'audio',

  // Documents
  docx: 'document',
  doc: 'document',
  xlsx: 'document',
  xls: 'document',
  pptx: 'document',
  ppt: 'document',
  odt: 'document',
  ods: 'document',
  odp: 'document',
  rtf: 'document',
  txt: 'document',
  md: 'document',
  markdown: 'document',
  html: 'document',
  htm: 'document',

  // Archives
  zip: 'archive',
  tar: 'archive',
  gz: 'archive',
  rar: 'archive',
  '7z': 'archive',
  bz2: 'archive',

  // Data
  json: 'data',
  csv: 'data',
  yaml: 'data',
  yml: 'data',
  xml: 'data',
  tsv: 'data',
};

const COMMON_MIME_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  tiff: 'image/tiff',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  pdf: 'application/pdf',
  mp4: 'video/mp4',
  mkv: 'video/x-matroska',
  mov: 'video/quicktime',
  webm: 'video/webm',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  flac: 'audio/flac',
  ogg: 'audio/ogg',
  json: 'application/json',
  csv: 'text/csv',
  yaml: 'text/yaml',
  yml: 'text/yaml',
  xml: 'application/xml',
  txt: 'text/plain',
  md: 'text/markdown',
  html: 'text/html',
  zip: 'application/zip',
  tar: 'application/x-tar',
  gz: 'application/gzip',
};

export async function inspectFile(filePath: string): Promise<FileItem> {
  const stats = await fs.promises.stat(filePath);
  const ext = path.extname(filePath).replace(/^\./, '').toLowerCase();
  const name = path.basename(filePath);

  let mimeType = COMMON_MIME_TYPES[ext] || 'application/octet-stream';
  let category: FileCategory = EXTENSION_CATEGORY_MAP[ext] || 'other';

  try {
    const ft = await fileTypeFromFile(filePath);
    if (ft) {
      mimeType = ft.mime;
      if (ft.mime.startsWith('image/')) category = 'image';
      else if (ft.mime === 'application/pdf') category = 'pdf';
      else if (ft.mime.startsWith('video/')) category = 'video';
      else if (ft.mime.startsWith('audio/')) category = 'audio';
      else if (['application/zip', 'application/x-tar', 'application/gzip', 'application/x-7z-compressed'].includes(ft.mime)) {
        category = 'archive';
      }
    }
  } catch {
    // Fall back to extension mapping
  }

  const fileItem: FileItem = {
    id: `${filePath}-${stats.mtimeMs}`,
    name,
    path: filePath,
    size: stats.size,
    extension: ext,
    mimeType,
    category,
    lastModified: stats.mtimeMs,
  };

  // Extract metadata if image
  if (category === 'image' && ['png', 'jpg', 'jpeg', 'webp', 'avif', 'tiff', 'gif'].includes(ext)) {
    try {
      const metadata = await sharp(filePath).metadata();
      if (metadata.width && metadata.height) {
        fileItem.dimensions = {
          width: metadata.width,
          height: metadata.height,
        };
      }
    } catch {
      // Ignore image metadata error
    }
  }

  // Extract metadata if PDF
  if (category === 'pdf') {
    try {
      const buffer = await fs.promises.readFile(filePath);
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      fileItem.pageCount = pdfDoc.getPageCount();
      if (fileItem.pageCount > 0) {
        const page = pdfDoc.getPage(0);
        const { width, height } = page.getSize();
        fileItem.dimensions = { width: Math.round(width), height: Math.round(height) };
      }
    } catch {
      // Ignore PDF metadata error
    }
  }

  return fileItem;
}
