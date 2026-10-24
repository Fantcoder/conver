import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { inspectFile } from '../src/main/conversion/format-detection';
import { getCapabilitiesForFile } from '../src/main/conversion/registry';
import { processImageConversion } from '../src/main/conversion/adapters/image-adapter';
import {
  getPdfDetails,
  mergePdfs,
  rotatePdf,
  watermarkPdf,
} from '../src/main/conversion/adapters/pdf-adapter';
import { processDataConversion } from '../src/main/conversion/adapters/data-adapter';
import { processDocumentConversion } from '../src/main/conversion/adapters/document-adapter';
import { processArchiveConversion } from '../src/main/conversion/adapters/archive-adapter';
import { FileItem } from '../src/shared/types';

async function runAllTests() {
  console.log('\n🚀 Starting ConvertFlow Automated Test Suite...\n');
  const tempDir = path.join(__dirname, 'temp_test_output');
  if (fs.existsSync(tempDir)) {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
  await fs.promises.mkdir(tempDir, { recursive: true });

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // ==================== TEST 1: GENERATE TEST FIXTURES ====================
    console.log('📌 Test Group 1: Generating Test Fixtures...');
    const testPngPath = path.join(tempDir, 'test_image.png');
    await sharp({
      create: {
        width: 300,
        height: 200,
        channels: 4,
        background: { r: 99, g: 102, b: 241, alpha: 1 },
      },
    })
      .png()
      .toFile(testPngPath);

    assert(fs.existsSync(testPngPath), 'Generate test image (300x200 PNG)');

    const fileItem: FileItem = await inspectFile(testPngPath);
    assert(fileItem.category === 'image', 'Detect category as image');
    assert(fileItem.dimensions?.width === 300, 'Inspect correct width (300px)');
    assert(fileItem.dimensions?.height === 200, 'Inspect correct height (200px)');

    // ==================== TEST 2: CAPABILITY REGISTRY ====================
    console.log('\n📌 Test Group 2: Capability Registry...');
    const caps = getCapabilitiesForFile(fileItem);
    assert(caps.length >= 8, `Image capabilities registered (Found ${caps.length})`);
    assert(caps.some((c) => c.targetFormat === 'WebP'), 'Contains WebP capability');
    assert(caps.some((c) => c.targetFormat === 'PDF'), 'Contains PDF capability');
    assert(caps.some((c) => c.id === 'img-compress'), 'Contains Compress capability');

    // ==================== TEST 3: IMAGE CONVERSIONS (SHARP) ====================
    console.log('\n📌 Test Group 3: Sharp Image Conversions...');
    const webpCap = caps.find((c) => c.targetFormat === 'WebP')!;
    const webpRes = await processImageConversion(fileItem, webpCap, { quality: 80 }, tempDir);
    assert(fs.existsSync(webpRes.outputPath), 'PNG → WebP converted successfully');
    assert(webpRes.outputSize > 0, `WebP file size valid (${webpRes.outputSize} bytes)`);

    const pdfCap = caps.find((c) => c.targetFormat === 'PDF')!;
    const imgPdfRes = await processImageConversion(fileItem, pdfCap, {}, tempDir);
    assert(fs.existsSync(imgPdfRes.outputPath), 'Image → PDF converted successfully');
    assert(imgPdfRes.outputSize > 0, 'PDF file created from image');

    const resizeCap = caps.find((c) => c.id === 'img-resize')!;
    const resizeRes = await processImageConversion(fileItem, resizeCap, { scale: 50 }, tempDir);
    const resizedMeta = await sharp(resizeRes.outputPath).metadata();
    assert(resizedMeta.width === 150, 'Resized width scaled to 50% (150px)');

    // ==================== TEST 4: DATA ADAPTER ====================
    console.log('\n📌 Test Group 4: Structured Data Conversions...');
    const jsonFixturePath = path.join(__dirname, 'fixtures', 'sample.json');
    const jsonFileItem = await inspectFile(jsonFixturePath);

    const jsonToCsvCap = {
      id: 'json-to-csv',
      label: 'Convert to CSV',
      category: 'convert' as const,
      targetFormat: 'CSV',
      targetExtension: 'csv',
      targetMimeType: 'text/csv',
      icon: 'table',
      description: 'CSV format',
      estimatedSpeed: 'instant' as const,
      lossless: true,
      priority: 100,
    };
    const csvRes = await processDataConversion(jsonFileItem, jsonToCsvCap, {}, tempDir);
    assert(fs.existsSync(csvRes.outputPath), 'JSON → CSV converted successfully');
    const csvContent = await fs.promises.readFile(csvRes.outputPath, 'utf-8');
    assert(csvContent.includes('ConvertFlow Studio'), 'CSV contains parsed records');

    const jsonToYamlCap = {
      id: 'json-to-yaml',
      label: 'Convert to YAML',
      category: 'convert' as const,
      targetFormat: 'YAML',
      targetExtension: 'yaml',
      targetMimeType: 'text/yaml',
      icon: 'code',
      description: 'YAML format',
      estimatedSpeed: 'instant' as const,
      lossless: true,
      priority: 95,
    };
    const yamlRes = await processDataConversion(jsonFileItem, jsonToYamlCap, {}, tempDir);
    assert(fs.existsSync(yamlRes.outputPath), 'JSON → YAML converted successfully');
    const yamlContent = await fs.promises.readFile(yamlRes.outputPath, 'utf-8');
    assert(yamlContent.includes('status: production'), 'YAML formatted cleanly');

    // ==================== TEST 5: DOCUMENT ADAPTER ====================
    console.log('\n📌 Test Group 5: Document & Markdown Conversions...');
    const mdFixturePath = path.join(__dirname, 'fixtures', 'sample.md');
    const mdFileItem = await inspectFile(mdFixturePath);

    const mdToHtmlCap = {
      id: 'md-to-html',
      label: 'Convert to HTML',
      category: 'convert' as const,
      targetFormat: 'HTML',
      targetExtension: 'html',
      targetMimeType: 'text/html',
      icon: 'code',
      description: 'HTML markup',
      estimatedSpeed: 'instant' as const,
      lossless: true,
      priority: 100,
    };
    const htmlRes = await processDocumentConversion(mdFileItem, mdToHtmlCap, {}, tempDir);
    assert(fs.existsSync(htmlRes.outputPath), 'Markdown → HTML converted');
    const htmlContent = await fs.promises.readFile(htmlRes.outputPath, 'utf-8');
    assert(htmlContent.includes('<h1>ConvertFlow Documentation</h1>'), 'Markdown rendered to HTML tags');

    const mdToPdfCap = {
      id: 'md-to-pdf',
      label: 'Convert to PDF',
      category: 'convert' as const,
      targetFormat: 'PDF',
      targetExtension: 'pdf',
      targetMimeType: 'application/pdf',
      icon: 'file-text',
      description: 'PDF doc',
      estimatedSpeed: 'instant' as const,
      lossless: true,
      priority: 85,
    };
    const docPdfRes = await processDocumentConversion(mdFileItem, mdToPdfCap, {}, tempDir);
    assert(fs.existsSync(docPdfRes.outputPath), 'Markdown → Formatted PDF document generated');

    // ==================== TEST 6: PDF TOOLKIT ADAPTER ====================
    console.log('\n📌 Test Group 6: PDF Toolkit Operations...');
    const samplePdfPath = docPdfRes.outputPath;
    const details = await getPdfDetails(samplePdfPath);
    assert(details.pageCount >= 1, `PDF details read (Page count: ${details.pageCount})`);

    const rotatePath = path.join(tempDir, 'sample-rotated.pdf');
    await rotatePdf({
      filePath: samplePdfPath,
      outputPath: rotatePath,
      degrees: 90,
    });
    assert(fs.existsSync(rotatePath), 'PDF rotated 90 degrees successfully');

    const watermarkPath = path.join(tempDir, 'sample-watermarked.pdf');
    await watermarkPdf({
      filePath: samplePdfPath,
      outputPath: watermarkPath,
      text: 'ANTIGRAVITY TEST',
      opacity: 40,
    });
    assert(fs.existsSync(watermarkPath), 'PDF watermarked with custom stamp');

    const mergePath = path.join(tempDir, 'sample-merged.pdf');
    await mergePdfs({
      files: [samplePdfPath, rotatePath],
      outputPath: mergePath,
    });
    assert(fs.existsSync(mergePath), 'Multiple PDFs merged into unified document');
    const mergedDetails = await getPdfDetails(mergePath);
    assert(mergedDetails.pageCount >= 2, `Merged PDF has combined pages (${mergedDetails.pageCount})`);

    // ==================== TEST 7: ARCHIVE ADAPTER ====================
    console.log('\n📌 Test Group 7: Archive Compression & Extraction...');
    const zipCap = {
      id: 'compress-to-zip',
      label: 'Compress to ZIP',
      category: 'compress' as const,
      targetFormat: 'ZIP',
      targetExtension: 'zip',
      targetMimeType: 'application/zip',
      icon: 'archive',
      description: 'ZIP archive',
      estimatedSpeed: 'fast' as const,
      lossless: true,
      priority: 40,
    };
    const zipRes = await processArchiveConversion(fileItem, zipCap, {}, tempDir);
    assert(fs.existsSync(zipRes.outputPath), 'Compressed source image into ZIP archive');

    const extractCap = {
      id: 'extract-archive',
      label: 'Extract Archive',
      category: 'extract' as const,
      targetFormat: 'FOLDER',
      targetExtension: '',
      targetMimeType: 'application/x-directory',
      icon: 'folder',
      description: 'Extract',
      estimatedSpeed: 'fast' as const,
      lossless: true,
      priority: 100,
    };
    const zipFileItem = await inspectFile(zipRes.outputPath);
    const extractRes = await processArchiveConversion(zipFileItem, extractCap, {}, tempDir);
    assert(fs.existsSync(extractRes.outputPath), 'Extracted ZIP contents to clean target directory');

    console.log(`\n========================================`);
    console.log(`📊 Test Suite Results: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  } finally {
    // Cleanup temp
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  }
}

runAllTests();
