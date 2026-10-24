import fs from 'node:fs';
import path from 'node:path';
import * as archiverNamespace from 'archiver';
import extractZip from 'extract-zip';
import * as tar from 'tar';
import { ConversionCapability, FileItem } from '../../../shared/types';

function createArchiveStream(format: 'zip' | 'tar', options?: any): any {
  if (typeof archiverNamespace === 'function') {
    return (archiverNamespace as any)(format, options);
  }
  const anyArchiver = (archiverNamespace as any).default || archiverNamespace;
  if (typeof anyArchiver === 'function') {
    return anyArchiver(format, options);
  }
  if (format === 'tar' && anyArchiver.TarArchive) {
    return new anyArchiver.TarArchive(options);
  }
  if (anyArchiver.ZipArchive) {
    return new anyArchiver.ZipArchive(options);
  }
  throw new Error(`Unable to initialize ${format} archive compressor`);
}

export interface ArchiveConversionResult {
  outputPath: string;
  outputSize: number;
}

export async function processArchiveConversion(
  file: FileItem,
  capability: ConversionCapability,
  options: Record<string, any>,
  targetDir: string,
  onProgress?: (progress: number, stage?: string) => void,
): Promise<ArchiveConversionResult> {
  const baseName = path.parse(file.name).name;

  // Extraction
  if (capability.id === 'extract-archive') {
    onProgress?.(20, 'Preparing extraction folder...');
    const destFolder = path.join(targetDir, `${baseName}-extracted`);
    await fs.promises.mkdir(destFolder, { recursive: true });

    onProgress?.(50, 'Extracting archive contents...');
    const extLower = file.extension.toLowerCase();
    if (extLower === 'zip') {
      await extractZip(file.path, { dir: destFolder });
    } else if (extLower === 'tar' || extLower === 'gz' || extLower === 'tgz') {
      await tar.x({
        file: file.path,
        cwd: destFolder,
      });
    } else {
      throw new Error(
        `Extraction for .${file.extension} is not currently supported`,
      );
    }

    onProgress?.(100, 'Extraction complete');
    return {
      outputPath: destFolder,
      outputSize: 0,
    };
  }

  // Compression to ZIP or TAR.GZ
  const isTarGz = capability.id === 'compress-to-tar-gz';
  const ext = isTarGz ? 'tar.gz' : 'zip';
  const outputPath = path.join(targetDir, `${baseName}.${ext}`);

  onProgress?.(20, `Creating ${ext.toUpperCase()} archive stream...`);
  const outputStream = fs.createWriteStream(outputPath);
  const archive = isTarGz
    ? createArchiveStream('tar', { gzip: true, gzipOptions: { level: 9 } })
    : createArchiveStream('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    outputStream.on('close', async () => {
      const stats = await fs.promises.stat(outputPath);
      onProgress?.(100, 'Archive completed');
      resolve({ outputPath, outputSize: stats.size });
    });

    archive.on('error', (err: any) => {
      reject(err);
    });

    archive.on('progress', (data: any) => {
      const total = data.entries?.total || 1;
      const processed = data.entries?.processed || 0;
      const pct = Math.min(95, Math.round((processed / total) * 100));
      onProgress?.(pct, `Archiving files (${processed}/${total})...`);
    });

    archive.pipe(outputStream);

    // Check if source is directory or file
    fs.stat(file.path, (err: any, stats: any) => {
      if (err) return reject(err);
      if (stats.isDirectory()) {
        archive.directory(file.path, baseName);
      } else {
        archive.file(file.path, { name: file.name });
      }
      archive.finalize();
    });
  });
}
