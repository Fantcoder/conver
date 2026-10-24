import { ConversionCapability, FileItem } from '../../shared/types';

export function getCapabilitiesForFile(file: FileItem): ConversionCapability[] {
  const ext = file.extension.toLowerCase();
  const cat = file.category;
  const capabilities: ConversionCapability[] = [];

  // ==================== IMAGE CAPABILITIES ====================
  if (cat === 'image') {
    // 1. Convert to WebP
    if (ext !== 'webp') {
      capabilities.push({
        id: 'img-to-webp',
        label: 'Convert to WebP',
        category: 'convert',
        targetFormat: 'WebP',
        targetExtension: 'webp',
        targetMimeType: 'image/webp',
        icon: 'image',
        description: 'Modern web image format with superior compression',
        estimatedSpeed: 'fast',
        lossless: false,
        badge: 'Recommended',
        priority: 100,
        options: [
          {
            id: 'quality',
            label: 'Quality',
            type: 'slider',
            defaultValue: 85,
            min: 10,
            max: 100,
            step: 5,
            unit: '%',
          },
          {
            id: 'lossless',
            label: 'Lossless Mode',
            type: 'toggle',
            defaultValue: false,
          },
        ],
      });
    }

    // 2. Convert to PNG
    if (ext !== 'png') {
      capabilities.push({
        id: 'img-to-png',
        label: 'Convert to PNG',
        category: 'convert',
        targetFormat: 'PNG',
        targetExtension: 'png',
        targetMimeType: 'image/png',
        icon: 'image',
        description: 'Lossless format supporting full alpha transparency',
        estimatedSpeed: 'fast',
        lossless: true,
        priority: 95,
      });
    }

    // 3. Convert to JPG
    if (ext !== 'jpg' && ext !== 'jpeg') {
      capabilities.push({
        id: 'img-to-jpg',
        label: 'Convert to JPG',
        category: 'convert',
        targetFormat: 'JPG',
        targetExtension: 'jpg',
        targetMimeType: 'image/jpeg',
        icon: 'image',
        description: 'Universal standard photo format',
        estimatedSpeed: 'fast',
        lossless: false,
        priority: 90,
        options: [
          {
            id: 'quality',
            label: 'Quality',
            type: 'slider',
            defaultValue: 85,
            min: 10,
            max: 100,
            step: 5,
            unit: '%',
          },
        ],
      });
    }

    // 4. Convert to PDF
    capabilities.push({
      id: 'img-to-pdf',
      label: 'Convert to PDF',
      category: 'convert',
      targetFormat: 'PDF',
      targetExtension: 'pdf',
      targetMimeType: 'application/pdf',
      icon: 'file-text',
      description: 'Wrap image cleanly into a shareable PDF document',
      estimatedSpeed: 'instant',
      lossless: true,
      priority: 85,
    });

    // 5. Convert to AVIF
    if (ext !== 'avif') {
      capabilities.push({
        id: 'img-to-avif',
        label: 'Convert to AVIF',
        category: 'convert',
        targetFormat: 'AVIF',
        targetExtension: 'avif',
        targetMimeType: 'image/avif',
        icon: 'zap',
        description: 'Next-gen format with highest compression efficiency',
        estimatedSpeed: 'moderate',
        lossless: false,
        priority: 80,
        options: [
          {
            id: 'quality',
            label: 'Quality',
            type: 'slider',
            defaultValue: 75,
            min: 10,
            max: 100,
            step: 5,
            unit: '%',
          },
        ],
      });
    }

    // 6. Compress Image
    capabilities.push({
      id: 'img-compress',
      label: 'Compress Image',
      category: 'compress',
      targetFormat: ext.toUpperCase(),
      targetExtension: ext,
      targetMimeType: file.mimeType,
      icon: 'minimize-2',
      description: 'Smart compression to shrink file size while preserving quality',
      estimatedSpeed: 'fast',
      lossless: false,
      badge: 'Shrink',
      priority: 75,
      options: [
        {
          id: 'quality',
          label: 'Target Quality',
          type: 'slider',
          defaultValue: 75,
          min: 20,
          max: 95,
          step: 5,
          unit: '%',
        },
      ],
    });

    // 7. Convert to ICO
    capabilities.push({
      id: 'img-to-ico',
      label: 'Generate ICO / Favicon',
      category: 'convert',
      targetFormat: 'ICO',
      targetExtension: 'ico',
      targetMimeType: 'image/x-icon',
      icon: 'box',
      description: 'Windows icon / web favicon (16, 32, 48, 64, 128, 256px)',
      estimatedSpeed: 'fast',
      lossless: true,
      priority: 70,
    });

    // 8. Convert to TIFF
    if (ext !== 'tiff' && ext !== 'tif') {
      capabilities.push({
        id: 'img-to-tiff',
        label: 'Convert to TIFF',
        category: 'convert',
        targetFormat: 'TIFF',
        targetExtension: 'tiff',
        targetMimeType: 'image/tiff',
        icon: 'printer',
        description: 'High-depth archival and printing format',
        estimatedSpeed: 'fast',
        lossless: true,
        priority: 65,
      });
    }

    // 9. Resize Image
    capabilities.push({
      id: 'img-resize',
      label: 'Resize Image',
      category: 'edit',
      targetFormat: ext.toUpperCase(),
      targetExtension: ext,
      targetMimeType: file.mimeType,
      icon: 'maximize-2',
      description: 'Scale dimensions proportionally or to custom resolution',
      estimatedSpeed: 'fast',
      lossless: false,
      priority: 60,
      options: [
        {
          id: 'scale',
          label: 'Scale Preset',
          type: 'select',
          defaultValue: '50',
          options: [
            { label: '75% Scale', value: '75' },
            { label: '50% Scale (Half)', value: '50' },
            { label: '25% Scale (Quarter)', value: '25' },
            { label: '200% Scale (Double)', value: '200' },
          ],
        },
      ],
    });

    // 10. Grayscale / Black & White
    capabilities.push({
      id: 'img-grayscale',
      label: 'Convert to Grayscale',
      category: 'edit',
      targetFormat: ext.toUpperCase(),
      targetExtension: ext,
      targetMimeType: file.mimeType,
      icon: 'sliders',
      description: 'Strip color channels into smooth monochrome',
      estimatedSpeed: 'instant',
      lossless: false,
      priority: 55,
    });
  }

  // ==================== PDF CAPABILITIES ====================
  if (cat === 'pdf') {
    // 1. PDF to PNG
    capabilities.push({
      id: 'pdf-to-png',
      label: 'Extract Pages as PNG',
      category: 'convert',
      targetFormat: 'PNG',
      targetExtension: 'png',
      targetMimeType: 'image/png',
      icon: 'image',
      description: 'Convert PDF pages into high-resolution PNG images',
      estimatedSpeed: 'fast',
      lossless: true,
      badge: 'Popular',
      priority: 100,
    });

    // 2. PDF to JPG
    capabilities.push({
      id: 'pdf-to-jpg',
      label: 'Extract Pages as JPG',
      category: 'convert',
      targetFormat: 'JPG',
      targetExtension: 'jpg',
      targetMimeType: 'image/jpeg',
      icon: 'image',
      description: 'Convert PDF pages into compact JPG photos',
      estimatedSpeed: 'fast',
      lossless: false,
      priority: 95,
      options: [
        {
          id: 'quality',
          label: 'Quality',
          type: 'slider',
          defaultValue: 85,
          min: 20,
          max: 100,
          step: 5,
          unit: '%',
        },
      ],
    });

    // 3. Compress PDF
    capabilities.push({
      id: 'pdf-compress',
      label: 'Compress PDF',
      category: 'compress',
      targetFormat: 'PDF',
      targetExtension: 'pdf',
      targetMimeType: 'application/pdf',
      icon: 'minimize-2',
      description: 'Optimize PDF structure and compress embedded objects',
      estimatedSpeed: 'fast',
      lossless: true,
      priority: 90,
    });

    // 4. Split PDF
    capabilities.push({
      id: 'pdf-split',
      label: 'Split PDF Pages',
      category: 'split',
      targetFormat: 'PDF',
      targetExtension: 'pdf',
      targetMimeType: 'application/pdf',
      icon: 'scissors',
      description: 'Extract individual pages or ranges into separate PDFs',
      estimatedSpeed: 'instant',
      lossless: true,
      priority: 85,
      options: [
        {
          id: 'mode',
          label: 'Split Mode',
          type: 'select',
          defaultValue: 'all',
          options: [
            { label: 'Split every page into a file', value: 'all' },
            { label: 'Extract custom page range', value: 'ranges' },
          ],
        },
        {
          id: 'ranges',
          label: 'Page Range (e.g. 1-3, 5)',
          type: 'text',
          defaultValue: '1',
          description: 'Used if Split Mode is set to custom ranges',
        },
      ],
    });

    // 5. Rotate PDF
    capabilities.push({
      id: 'pdf-rotate',
      label: 'Rotate PDF',
      category: 'edit',
      targetFormat: 'PDF',
      targetExtension: 'pdf',
      targetMimeType: 'application/pdf',
      icon: 'rotate-cw',
      description: 'Rotate orientation by 90°, 180°, or 270°',
      estimatedSpeed: 'instant',
      lossless: true,
      priority: 80,
      options: [
        {
          id: 'degrees',
          label: 'Rotation Angle',
          type: 'select',
          defaultValue: 90,
          options: [
            { label: '90° Clockwise', value: 90 },
            { label: '180° Upside Down', value: 180 },
            { label: '270° (90° Counter-Clockwise)', value: 270 },
          ],
        },
      ],
    });

    // 6. Watermark PDF
    capabilities.push({
      id: 'pdf-watermark',
      label: 'Watermark PDF',
      category: 'edit',
      targetFormat: 'PDF',
      targetExtension: 'pdf',
      targetMimeType: 'application/pdf',
      icon: 'stamp',
      description: 'Add a customized copyright or security stamp across all pages',
      estimatedSpeed: 'fast',
      lossless: true,
      priority: 75,
      options: [
        {
          id: 'text',
          label: 'Watermark Text',
          type: 'text',
          defaultValue: 'CONFIDENTIAL',
        },
        {
          id: 'opacity',
          label: 'Opacity',
          type: 'slider',
          defaultValue: 30,
          min: 10,
          max: 100,
          step: 5,
          unit: '%',
        },
      ],
    });

    // 7. Encrypt PDF
    capabilities.push({
      id: 'pdf-encrypt',
      label: 'Protect / Encrypt PDF',
      category: 'security',
      targetFormat: 'PDF',
      targetExtension: 'pdf',
      targetMimeType: 'application/pdf',
      icon: 'lock',
      description: 'Secure document with military-grade AES password protection',
      estimatedSpeed: 'fast',
      lossless: true,
      priority: 70,
      options: [
        {
          id: 'userPassword',
          label: 'User Password to Open',
          type: 'text',
          defaultValue: '',
        },
      ],
    });
  }

  // ==================== DATA CAPABILITIES ====================
  if (cat === 'data') {
    if (ext === 'json') {
      capabilities.push({
        id: 'json-to-csv',
        label: 'Convert to CSV',
        category: 'convert',
        targetFormat: 'CSV',
        targetExtension: 'csv',
        targetMimeType: 'text/csv',
        icon: 'table',
        description: 'Tabular spreadsheet format for Excel, Google Sheets',
        estimatedSpeed: 'instant',
        lossless: true,
        priority: 100,
      });
      capabilities.push({
        id: 'json-to-yaml',
        label: 'Convert to YAML',
        category: 'convert',
        targetFormat: 'YAML',
        targetExtension: 'yaml',
        targetMimeType: 'text/yaml',
        icon: 'code',
        description: 'Clean, human-readable configuration data format',
        estimatedSpeed: 'instant',
        lossless: true,
        priority: 95,
      });
      capabilities.push({
        id: 'json-to-xml',
        label: 'Convert to XML',
        category: 'convert',
        targetFormat: 'XML',
        targetExtension: 'xml',
        targetMimeType: 'application/xml',
        icon: 'code',
        description: 'Structured markup interchange format',
        estimatedSpeed: 'instant',
        lossless: true,
        priority: 90,
      });
    } else if (ext === 'csv' || ext === 'tsv') {
      capabilities.push({
        id: 'csv-to-json',
        label: 'Convert to JSON',
        category: 'convert',
        targetFormat: 'JSON',
        targetExtension: 'json',
        targetMimeType: 'application/json',
        icon: 'braces',
        description: 'Standard JSON array of objects',
        estimatedSpeed: 'instant',
        lossless: true,
        priority: 100,
      });
      capabilities.push({
        id: 'csv-to-yaml',
        label: 'Convert to YAML',
        category: 'convert',
        targetFormat: 'YAML',
        targetExtension: 'yaml',
        targetMimeType: 'text/yaml',
        icon: 'code',
        description: 'YAML list format',
        estimatedSpeed: 'instant',
        lossless: true,
        priority: 90,
      });
    } else if (ext === 'yaml' || ext === 'yml') {
      capabilities.push({
        id: 'yaml-to-json',
        label: 'Convert to JSON',
        category: 'convert',
        targetFormat: 'JSON',
        targetExtension: 'json',
        targetMimeType: 'application/json',
        icon: 'braces',
        description: 'Standard JSON data',
        estimatedSpeed: 'instant',
        lossless: true,
        priority: 100,
      });
      capabilities.push({
        id: 'yaml-to-csv',
        label: 'Convert to CSV',
        category: 'convert',
        targetFormat: 'CSV',
        targetExtension: 'csv',
        targetMimeType: 'text/csv',
        icon: 'table',
        description: 'Tabular CSV records',
        estimatedSpeed: 'instant',
        lossless: true,
        priority: 90,
      });
    } else if (ext === 'xml') {
      capabilities.push({
        id: 'xml-to-json',
        label: 'Convert to JSON',
        category: 'convert',
        targetFormat: 'JSON',
        targetExtension: 'json',
        targetMimeType: 'application/json',
        icon: 'braces',
        description: 'Parse XML tree into JSON structure',
        estimatedSpeed: 'instant',
        lossless: true,
        priority: 100,
      });
    }
  }

  // ==================== DOCUMENT & MARKUP CAPABILITIES ====================
  if (cat === 'document') {
    if (ext === 'md' || ext === 'markdown') {
      capabilities.push({
        id: 'md-to-html',
        label: 'Convert to HTML',
        category: 'convert',
        targetFormat: 'HTML',
        targetExtension: 'html',
        targetMimeType: 'text/html',
        icon: 'code',
        description: 'Render Markdown into stylized, clean HTML markup',
        estimatedSpeed: 'instant',
        lossless: true,
        priority: 100,
      });
      capabilities.push({
        id: 'md-to-txt',
        label: 'Convert to Plain Text',
        category: 'convert',
        targetFormat: 'TXT',
        targetExtension: 'txt',
        targetMimeType: 'text/plain',
        icon: 'file-text',
        description: 'Strip Markdown formatting into clean plain text',
        estimatedSpeed: 'instant',
        lossless: true,
        priority: 90,
      });
      capabilities.push({
        id: 'md-to-pdf',
        label: 'Convert to PDF',
        category: 'convert',
        targetFormat: 'PDF',
        targetExtension: 'pdf',
        targetMimeType: 'application/pdf',
        icon: 'file-text',
        description: 'Generate formatted PDF document from Markdown',
        estimatedSpeed: 'instant',
        lossless: true,
        priority: 85,
      });
    } else if (ext === 'html' || ext === 'htm') {
      capabilities.push({
        id: 'html-to-md',
        label: 'Convert to Markdown',
        category: 'convert',
        targetFormat: 'MD',
        targetExtension: 'md',
        targetMimeType: 'text/markdown',
        icon: 'file-text',
        description: 'Clean HTML down to modern readable Markdown syntax',
        estimatedSpeed: 'instant',
        lossless: true,
        priority: 100,
      });
      capabilities.push({
        id: 'html-to-txt',
        label: 'Convert to Plain Text',
        category: 'convert',
        targetFormat: 'TXT',
        targetExtension: 'txt',
        targetMimeType: 'text/plain',
        icon: 'file-text',
        description: 'Strip tags to plain text content',
        estimatedSpeed: 'instant',
        lossless: true,
        priority: 90,
      });
    } else if (ext === 'txt') {
      capabilities.push({
        id: 'txt-to-pdf',
        label: 'Convert to PDF',
        category: 'convert',
        targetFormat: 'PDF',
        targetExtension: 'pdf',
        targetMimeType: 'application/pdf',
        icon: 'file-text',
        description: 'Convert text file into a clean, paginated PDF',
        estimatedSpeed: 'instant',
        lossless: true,
        priority: 100,
      });
    }
  }

  // ==================== ARCHIVE CAPABILITIES ====================
  // Any file can be compressed to an archive
  if (cat !== 'archive') {
    capabilities.push({
      id: 'compress-to-zip',
      label: 'Compress to ZIP',
      category: 'compress',
      targetFormat: 'ZIP',
      targetExtension: 'zip',
      targetMimeType: 'application/zip',
      icon: 'archive',
      description: 'Standard cross-platform compressed archive',
      estimatedSpeed: 'fast',
      lossless: true,
      priority: 40,
    });
    capabilities.push({
      id: 'compress-to-tar-gz',
      label: 'Compress to TAR.GZ',
      category: 'compress',
      targetFormat: 'TAR.GZ',
      targetExtension: 'tar.gz',
      targetMimeType: 'application/gzip',
      icon: 'archive',
      description: 'UNIX standard compressed tarball archive',
      estimatedSpeed: 'fast',
      lossless: true,
      priority: 35,
    });
  } else {
    // If it's already an archive, allow extraction
    capabilities.push({
      id: 'extract-archive',
      label: 'Extract Archive',
      category: 'extract',
      targetFormat: 'FOLDER',
      targetExtension: '',
      targetMimeType: 'application/x-directory',
      icon: 'folder',
      description: 'Unpack all contents into a clean destination folder',
      estimatedSpeed: 'fast',
      lossless: true,
      badge: 'Unpack',
      priority: 100,
    });
  }

  return capabilities.sort((a, b) => b.priority - a.priority);
}
