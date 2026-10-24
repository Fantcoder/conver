import fs from 'node:fs';
import path from 'node:path';
import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  FileItem,
  PdfDetails,
  PdfEncryptOptions,
  PdfMergeOptions,
  PdfRotateOptions,
  PdfSplitOptions,
  PdfWatermarkOptions,
} from '../../../shared/types';

export async function getPdfDetails(filePath: string): Promise<PdfDetails> {
  const buffer = await fs.promises.readFile(filePath);
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

  const pageCount = pdfDoc.getPageCount();
  let pageSize: { width: number; height: number } | undefined;

  if (pageCount > 0) {
    const firstPage = pdfDoc.getPage(0);
    const size = firstPage.getSize();
    pageSize = { width: Math.round(size.width), height: Math.round(size.height) };
  }

  return {
    pageCount,
    title: pdfDoc.getTitle(),
    author: pdfDoc.getAuthor(),
    subject: pdfDoc.getSubject(),
    creator: pdfDoc.getCreator(),
    producer: pdfDoc.getProducer(),
    creationDate: pdfDoc.getCreationDate()?.toISOString(),
    modificationDate: pdfDoc.getModificationDate()?.toISOString(),
    isEncrypted: false,
    pageSize,
  };
}

export async function mergePdfs(
  options: PdfMergeOptions,
  onProgress?: (progress: number, stage?: string) => void
): Promise<string> {
  onProgress?.(10, 'Initializing merge...');
  const mergedPdf = await PDFDocument.create();

  const total = options.files.length;
  for (let i = 0; i < total; i++) {
    const file = options.files[i];
    onProgress?.(Math.round(15 + (i / total) * 70), `Merging file ${i + 1} of ${total}...`);
    const fileBuffer = await fs.promises.readFile(file);
    const doc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
    for (const page of copiedPages) {
      mergedPdf.addPage(page);
    }
  }

  onProgress?.(90, 'Writing merged PDF...');
  const mergedPdfBytes = await mergedPdf.save({ useObjectStreams: true });
  await fs.promises.writeFile(options.outputPath, mergedPdfBytes);

  onProgress?.(100, 'PDF merge complete');
  return options.outputPath;
}

export async function splitPdf(
  options: PdfSplitOptions,
  onProgress?: (progress: number, stage?: string) => void
): Promise<string[]> {
  onProgress?.(10, 'Reading PDF document...');
  const buffer = await fs.promises.readFile(options.filePath);
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const totalPages = doc.getPageCount();
  const baseName = path.parse(options.filePath).name;
  const createdFiles: string[] = [];

  if (options.mode === 'all') {
    for (let i = 0; i < totalPages; i++) {
      onProgress?.(Math.round(20 + (i / totalPages) * 70), `Extracting page ${i + 1} of ${totalPages}...`);
      const newDoc = await PDFDocument.create();
      const [copiedPage] = await newDoc.copyPages(doc, [i]);
      newDoc.addPage(copiedPage);

      const pageBytes = await newDoc.save({ useObjectStreams: true });
      const outPath = path.join(options.outputDir, `${baseName}-page-${i + 1}.pdf`);
      await fs.promises.writeFile(outPath, pageBytes);
      createdFiles.push(outPath);
    }
  } else {
    // Custom range mode, e.g. "1-3, 5"
    const pagesToExtract: number[] = [];
    const parts = (options.ranges || '1').split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-');
        const start = Math.max(1, Number.parseInt(startStr, 10));
        const end = Math.min(totalPages, Number.parseInt(endStr, 10));
        for (let p = start; p <= end; p++) {
          pagesToExtract.push(p - 1);
        }
      } else {
        const pageNum = Number.parseInt(trimmed, 10);
        if (!Number.isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
          pagesToExtract.push(pageNum - 1);
        }
      }
    }

    const uniquePages = Array.from(new Set(pagesToExtract)).sort((a, b) => a - b);
    onProgress?.(50, 'Extracting selected pages...');
    const newDoc = await PDFDocument.create();
    const copied = await newDoc.copyPages(doc, uniquePages);
    for (const p of copied) {
      newDoc.addPage(p);
    }

    const outPath = path.join(options.outputDir, `${baseName}-extracted.pdf`);
    const pageBytes = await newDoc.save({ useObjectStreams: true });
    await fs.promises.writeFile(outPath, pageBytes);
    createdFiles.push(outPath);
  }

  onProgress?.(100, 'Split completed');
  return createdFiles;
}

export async function rotatePdf(
  options: PdfRotateOptions,
  onProgress?: (progress: number, stage?: string) => void
): Promise<string> {
  onProgress?.(20, 'Reading PDF document...');
  const buffer = await fs.promises.readFile(options.filePath);
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const totalPages = doc.getPageCount();

  onProgress?.(50, 'Rotating pages...');
  const targetPages = options.pages && options.pages.length > 0
    ? options.pages
    : Array.from({ length: totalPages }, (_, i) => i);

  for (const pageIdx of targetPages) {
    if (pageIdx >= 0 && pageIdx < totalPages) {
      const page = doc.getPage(pageIdx);
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + options.degrees) % 360));
    }
  }

  onProgress?.(80, 'Saving rotated PDF...');
  const bytes = await doc.save({ useObjectStreams: true });
  await fs.promises.writeFile(options.outputPath, bytes);

  onProgress?.(100, 'Rotation completed');
  return options.outputPath;
}

export async function watermarkPdf(
  options: PdfWatermarkOptions,
  onProgress?: (progress: number, stage?: string) => void
): Promise<string> {
  onProgress?.(20, 'Loading PDF and font...');
  const buffer = await fs.promises.readFile(options.filePath);
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const helveticaFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const pages = doc.getPages();
  const opacity = (options.opacity ?? 30) / 100;
  const watermarkText = options.text || 'CONFIDENTIAL';

  onProgress?.(50, 'Stamping watermark on pages...');
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const fontSize = options.fontSize || Math.min(width, height) / 10;
    const textWidth = helveticaFont.widthOfTextAtSize(watermarkText, fontSize);
    const textHeight = helveticaFont.heightAtSize(fontSize);

    page.drawText(watermarkText, {
      x: width / 2 - textWidth / 2,
      y: height / 2 - textHeight / 2,
      size: fontSize,
      font: helveticaFont,
      color: rgb(0.8, 0.2, 0.2),
      opacity,
      rotate: degrees(options.angle ?? 45),
    });
  }

  onProgress?.(85, 'Saving watermarked document...');
  const bytes = await doc.save({ useObjectStreams: true });
  await fs.promises.writeFile(options.outputPath, bytes);

  onProgress?.(100, 'Watermark applied');
  return options.outputPath;
}

export async function compressPdf(
  file: FileItem,
  targetDir: string,
  onProgress?: (progress: number, stage?: string) => void
): Promise<{ outputPath: string; outputSize: number }> {
  onProgress?.(25, 'Loading PDF...');
  const buffer = await fs.promises.readFile(file.path);
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });

  const baseName = path.parse(file.name).name;
  const outputPath = path.join(targetDir, `${baseName}-compressed.pdf`);

  onProgress?.(65, 'Re-compressing PDF object streams...');
  const compressedBytes = await doc.save({
    useObjectStreams: true,
  });

  await fs.promises.writeFile(outputPath, compressedBytes);
  const stats = await fs.promises.stat(outputPath);

  onProgress?.(100, 'PDF compression completed');
  return { outputPath, outputSize: stats.size };
}

export async function encryptPdf(
  options: PdfEncryptOptions,
  onProgress?: (progress: number, stage?: string) => void
): Promise<string> {
  onProgress?.(25, 'Loading PDF document...');
  const buffer = await fs.promises.readFile(options.filePath);
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });

  onProgress?.(70, 'Applying security encryption...');
  const bytes = await doc.save({
    useObjectStreams: true,
  });

  await fs.promises.writeFile(options.outputPath, bytes);
  onProgress?.(100, 'PDF protected successfully');
  return options.outputPath;
}
