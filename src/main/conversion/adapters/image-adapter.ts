import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import { ConversionCapability, FileItem } from '../../../shared/types';

// Optimize libvips with SIMD vectorization, multi-core concurrency, and bounded cache
try {
  sharp.concurrency(0);
  sharp.simd(true);
  sharp.cache({ memory: 64, files: 20, items: 50 });
} catch {
  // Ignore if SIMD not available
}

export interface ImageConversionResult {
  outputPath: string;
  outputSize: number;
}

export async function processImageConversion(
  file: FileItem,
  capability: ConversionCapability,
  options: Record<string, any>,
  targetDir: string,
  onProgress?: (progress: number, stage?: string) => void,
): Promise<ImageConversionResult> {
  const baseName = path.parse(file.name).name;
  let ext = capability.targetExtension.toLowerCase();
  if (!ext && capability.id === 'img-to-ico') ext = 'ico';

  onProgress?.(15, 'Reading source image...');

  // Special case: Image to PDF
  if (capability.id === 'img-to-pdf') {
    onProgress?.(40, 'Generating PDF document...');
    const outputPath = path.join(targetDir, `${baseName}.pdf`);

    // Ensure image is compatible with pdf-lib by transcoding cleanly via sharp
    const pngBuffer = await sharp(file.path).png().toBuffer();
    const metadata = await sharp(pngBuffer).metadata();

    onProgress?.(70, 'Embedding pages...');
    const pdfDoc = await PDFDocument.create();
    const embeddedImg = await pdfDoc.embedPng(pngBuffer);

    const width = metadata.width || embeddedImg.width;
    const height = metadata.height || embeddedImg.height;

    const page = pdfDoc.addPage([width, height]);
    page.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width,
      height,
    });

    const pdfBytes = await pdfDoc.save();
    await fs.promises.writeFile(outputPath, pdfBytes);

    const stats = await fs.promises.stat(outputPath);
    onProgress?.(100, 'PDF conversion completed');
    return { outputPath, outputSize: stats.size };
  }

  // General Sharp Pipeline
  let pipeline = sharp(file.path);
  const metadata = await pipeline.metadata();

  onProgress?.(35, 'Applying image transformations...');

  // Grayscale
  if (capability.id === 'img-grayscale') {
    pipeline = pipeline.grayscale();
  }

  // Resize
  if (capability.id === 'img-resize') {
    const scalePercent = Number.parseInt(options.scale || '50', 10);
    if (metadata.width && metadata.height) {
      const newWidth = Math.round((metadata.width * scalePercent) / 100);
      const newHeight = Math.round((metadata.height * scalePercent) / 100);
      pipeline = pipeline.resize(newWidth, newHeight);
    }
  }

  // Output formatting & quality
  const quality = Number.parseInt(options.quality ?? 85, 10);
  const lossless = Boolean(options.lossless);

  let targetFilename = `${baseName}.${ext}`;
  if (capability.id === 'img-compress') {
    targetFilename = `${baseName}-compressed.${ext}`;
  } else if (capability.id === 'img-resize') {
    targetFilename = `${baseName}-resized.${ext}`;
  } else if (capability.id === 'img-grayscale') {
    targetFilename = `${baseName}-grayscale.${ext}`;
  }

  const outputPath = path.join(targetDir, targetFilename);

  onProgress?.(65, 'Encoding target format...');

  switch (ext) {
    case 'webp':
      pipeline = pipeline.webp({ quality, lossless });
      break;
    case 'png':
      pipeline = pipeline.png({ compressionLevel: 9 });
      break;
    case 'jpg':
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      break;
    case 'avif':
      pipeline = pipeline.avif({ quality, lossless });
      break;
    case 'tiff':
    case 'tif':
      pipeline = pipeline.tiff({ quality });
      break;
    case 'gif':
      pipeline = pipeline.gif();
      break;
    case 'ico': {
      // Create high-res PNG then save as ICO structure (or 256x256 PNG wrapped as ICO)
      pipeline = pipeline
        .resize(256, 256, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png();
      break;
    }
    default:
      // Keep format or let sharp infer
      break;
  }

  onProgress?.(85, 'Writing file to disk...');
  await pipeline.toFile(outputPath);

  const stats = await fs.promises.stat(outputPath);
  onProgress?.(100, 'Conversion completed');

  return {
    outputPath,
    outputSize: stats.size,
  };
}
