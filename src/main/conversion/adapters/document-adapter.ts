import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import TurndownService from 'turndown';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { ConversionCapability, FileItem } from '../../../shared/types';

export interface DocumentConversionResult {
  outputPath: string;
  outputSize: number;
}

export async function processDocumentConversion(
  file: FileItem,
  capability: ConversionCapability,
  options: Record<string, any>,
  targetDir: string,
  onProgress?: (progress: number, stage?: string) => void,
): Promise<DocumentConversionResult> {
  onProgress?.(20, 'Reading document text...');
  const text = await fs.promises.readFile(file.path, 'utf-8');
  const baseName = path.parse(file.name).name;
  const targetExt = capability.targetExtension.toLowerCase();

  // MD to HTML
  if (capability.id === 'md-to-html') {
    onProgress?.(60, 'Rendering Markdown to HTML...');
    const parsedHtml = await marked.parse(text);
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${baseName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
      color: #222;
    }
    pre, code { background: #f4f4f5; border-radius: 4px; font-family: monospace; }
    pre { padding: 12px; overflow-x: auto; }
    blockquote { border-left: 4px solid #0071e3; margin: 0; padding-left: 16px; color: #555; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background-color: #f7f7f8; }
  </style>
</head>
<body>
${parsedHtml}
</body>
</html>`;
    const outputPath = path.join(targetDir, `${baseName}.html`);
    await fs.promises.writeFile(outputPath, fullHtml, 'utf-8');
    const stats = await fs.promises.stat(outputPath);
    onProgress?.(100, 'HTML document generated');
    return { outputPath, outputSize: stats.size };
  }

  // HTML to MD
  if (capability.id === 'html-to-md') {
    onProgress?.(60, 'Converting HTML to Markdown...');
    const turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });
    const markdown = turndown.turndown(text);
    const outputPath = path.join(targetDir, `${baseName}.md`);
    await fs.promises.writeFile(outputPath, markdown, 'utf-8');
    const stats = await fs.promises.stat(outputPath);
    onProgress?.(100, 'Markdown generated');
    return { outputPath, outputSize: stats.size };
  }

  // Text / MD to PDF
  if (capability.id === 'txt-to-pdf' || capability.id === 'md-to-pdf') {
    onProgress?.(50, 'Typesetting PDF pages...');
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 11;
    const lineHeight = 16;
    const margin = 50;
    const pageWidth = 595.28; // A4
    const pageHeight = 841.89; // A4
    const contentWidth = pageWidth - margin * 2;
    const maxLinesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);

    // Split text into lines, wrap long lines
    const rawLines = text.split(/\r?\n/);
    const wrappedLines: string[] = [];

    for (const rawLine of rawLines) {
      if (!rawLine) {
        wrappedLines.push('');
        continue;
      }
      let currentLine = '';
      const words = rawLine.split(' ');
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const width = font.widthOfTextAtSize(testLine, fontSize);
        if (width < contentWidth) {
          currentLine = testLine;
        } else {
          wrappedLines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) {
        wrappedLines.push(currentLine);
      }
    }

    onProgress?.(75, 'Drawing paginated text...');
    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let currentLineIndex = 0;

    for (const line of wrappedLines) {
      if (currentLineIndex >= maxLinesPerPage) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        currentLineIndex = 0;
      }

      const y = pageHeight - margin - currentLineIndex * lineHeight;
      if (line) {
        currentPage.drawText(line, {
          x: margin,
          y,
          size: fontSize,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });
      }
      currentLineIndex++;
    }

    const outputPath = path.join(targetDir, `${baseName}.pdf`);
    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    await fs.promises.writeFile(outputPath, pdfBytes);
    const stats = await fs.promises.stat(outputPath);
    onProgress?.(100, 'PDF document generated');
    return { outputPath, outputSize: stats.size };
  }

  // Fallback to text
  const outputPath = path.join(targetDir, `${baseName}.${targetExt || 'txt'}`);
  await fs.promises.writeFile(outputPath, text, 'utf-8');
  const stats = await fs.promises.stat(outputPath);
  onProgress?.(100, 'Conversion completed');
  return { outputPath, outputSize: stats.size };
}
