import path from 'node:path';
import { BrowserWindow } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { ConversionCapability, ConversionJob, FileItem } from '../../shared/types';
import { IPC_CHANNELS } from '../../shared/ipc-channels';
import { processImageConversion } from './adapters/image-adapter';
import { compressPdf } from './adapters/pdf-adapter';
import { processDataConversion } from './adapters/data-adapter';
import { processDocumentConversion } from './adapters/document-adapter';
import { processArchiveConversion } from './adapters/archive-adapter';
import { loadSettings } from '../services/settings-store';
import { addHistoryItem } from '../services/history-store';

const activeJobs = new Map<string, ConversionJob>();
const cancelledJobs = new Set<string>();

export function getJob(jobId: string): ConversionJob | undefined {
  return activeJobs.get(jobId);
}

export function cancelJob(jobId: string): boolean {
  if (activeJobs.has(jobId)) {
    cancelledJobs.add(jobId);
    const job = activeJobs.get(jobId)!;
    job.status = 'cancelled';
    notifyJobStatus(job);
    return true;
  }
  return false;
}

function notifyJobProgress(job: ConversionJob) {
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.ON_JOB_PROGRESS, {
        jobId: job.id,
        progress: job.progress,
        stage: job.stage,
      });
    }
  }
}

function notifyJobStatus(job: ConversionJob) {
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.ON_JOB_STATUS, {
        jobId: job.id,
        status: job.status,
        outputPath: job.outputPath,
        outputSize: job.outputSize,
        error: job.error,
      });
    }
  }
}

export async function runConversionJob(
  file: FileItem,
  capability: ConversionCapability,
  options: Record<string, any>
): Promise<string> {
  const jobId = uuidv4();
  const settings = await loadSettings();

  const targetDir = settings.outputDirectory && settings.outputDirectory.trim().length > 0
    ? settings.outputDirectory
    : path.dirname(file.path);

  const job: ConversionJob = {
    id: jobId,
    sourceFile: file,
    capability,
    targetFormat: capability.targetFormat,
    status: 'processing',
    progress: 5,
    stage: 'Starting conversion...',
    options,
    createdAt: Date.now(),
    startedAt: Date.now(),
  };

  activeJobs.set(jobId, job);
  notifyJobStatus(job);

  // Background execution
  (async () => {
    try {
      const onProgress = (pct: number, stage?: string) => {
        if (cancelledJobs.has(jobId)) throw new Error('Job was cancelled by user');
        job.progress = pct;
        job.stage = stage;
        notifyJobProgress(job);
      };

      let result: { outputPath: string; outputSize: number };

      const capId = capability.id;
      const cat = file.category;

      if (cat === 'image' || capId.startsWith('img-')) {
        result = await processImageConversion(file, capability, options, targetDir, onProgress);
      } else if (capId === 'pdf-compress') {
        result = await compressPdf(file, targetDir, onProgress);
      } else if (cat === 'data') {
        result = await processDataConversion(file, capability, options, targetDir, onProgress);
      } else if (cat === 'document') {
        result = await processDocumentConversion(file, capability, options, targetDir, onProgress);
      } else if (capId.startsWith('compress-to-') || capId === 'extract-archive') {
        result = await processArchiveConversion(file, capability, options, targetDir, onProgress);
      } else {
        throw new Error(`Unsupported conversion operation: ${capability.label}`);
      }

      job.status = 'completed';
      job.progress = 100;
      job.stage = 'Completed';
      job.outputPath = result.outputPath;
      job.outputSize = result.outputSize;
      job.completedAt = Date.now();

      notifyJobStatus(job);

      // Record to persistent history
      await addHistoryItem({
        id: jobId,
        sourceName: file.name,
        sourcePath: file.path,
        sourceSize: file.size,
        sourceFormat: file.extension.toUpperCase(),
        targetFormat: capability.targetFormat,
        outputPath: result.outputPath,
        outputSize: result.outputSize,
        operationLabel: capability.label,
        completedAt: Date.now(),
        status: 'completed',
      });
    } catch (err: any) {
      if (cancelledJobs.has(jobId)) {
        job.status = 'cancelled';
        job.error = 'Conversion cancelled';
      } else {
        job.status = 'failed';
        job.error = err?.message || 'Unknown conversion error occurred';
        console.error(`Conversion job ${jobId} failed:`, err);

        await addHistoryItem({
          id: jobId,
          sourceName: file.name,
          sourcePath: file.path,
          sourceSize: file.size,
          sourceFormat: file.extension.toUpperCase(),
          targetFormat: capability.targetFormat,
          outputPath: '',
          outputSize: 0,
          operationLabel: capability.label,
          completedAt: Date.now(),
          status: 'failed',
          error: job.error,
        });
      }
      notifyJobStatus(job);
    } finally {
      cancelledJobs.delete(jobId);
    }
  })();

  return jobId;
}
