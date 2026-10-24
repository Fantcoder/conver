import path from 'node:path';
import { BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';
import { inspectFile } from '../conversion/format-detection';
import { getCapabilitiesForFile } from '../conversion/registry';
import { cancelJob, runConversionJob } from '../conversion/job-manager';
import {
  getPdfDetails,
  mergePdfs,
  rotatePdf,
  splitPdf,
  watermarkPdf,
} from '../conversion/adapters/pdf-adapter';
import { loadSettings, saveSettings } from '../services/settings-store';
import { clearHistory, getHistory, removeHistoryItem } from '../services/history-store';
import {
  ConversionCapability,
  FileItem,
  PdfMergeOptions,
  PdfRotateOptions,
  PdfSplitOptions,
  PdfWatermarkOptions,
} from '../../shared/types';

export function registerIpcHandlers(): void {
  // ==================== FILE SYSTEM ====================
  ipcMain.handle(IPC_CHANNELS.FILE_SELECT_DIALOG, async (_, options) => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    const dialogOpts = {
      properties: [
        'openFile' as const,
        ...(options?.multiple ? ['multiSelections' as const] : []),
      ],
      filters: options?.filters,
    };
    const result = focusedWindow
      ? await dialog.showOpenDialog(focusedWindow, dialogOpts)
      : await dialog.showOpenDialog(dialogOpts);
    if (result.canceled) return null;
    return result.filePaths;
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_CHOOSE_OUTPUT_DIR, async () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    const dialogOpts = {
      properties: ['openDirectory' as const, 'createDirectory' as const],
    };
    const result = focusedWindow
      ? await dialog.showOpenDialog(focusedWindow, dialogOpts)
      : await dialog.showOpenDialog(dialogOpts);
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  ipcMain.handle(IPC_CHANNELS.FILE_INSPECT, async (_, filePath: string) => {
    return inspectFile(filePath);
  });

  ipcMain.handle(IPC_CHANNELS.FILE_INSPECT_MANY, async (_, filePaths: string[]) => {
    return Promise.all(filePaths.map((fp) => inspectFile(fp)));
  });

  // ==================== CAPABILITIES & JOBS ====================
  ipcMain.handle(IPC_CHANNELS.GET_CAPABILITIES, async (_, file: FileItem) => {
    return getCapabilitiesForFile(file);
  });

  ipcMain.handle(
    IPC_CHANNELS.START_JOB,
    async (
      _,
      payload: { file: FileItem; capability: ConversionCapability; options: Record<string, any> }
    ) => {
      return runConversionJob(payload.file, payload.capability, payload.options);
    }
  );

  ipcMain.handle(IPC_CHANNELS.CANCEL_JOB, async (_, jobId: string) => {
    return cancelJob(jobId);
  });

  // ==================== PDF TOOLKIT ====================
  ipcMain.handle(IPC_CHANNELS.PDF_GET_DETAILS, async (_, filePath: string) => {
    return getPdfDetails(filePath);
  });

  ipcMain.handle(IPC_CHANNELS.PDF_MERGE, async (_, options: PdfMergeOptions) => {
    return mergePdfs(options);
  });

  ipcMain.handle(IPC_CHANNELS.PDF_SPLIT, async (_, options: PdfSplitOptions) => {
    return splitPdf(options);
  });

  ipcMain.handle(IPC_CHANNELS.PDF_ROTATE, async (_, options: PdfRotateOptions) => {
    return rotatePdf(options);
  });

  ipcMain.handle(IPC_CHANNELS.PDF_WATERMARK, async (_, options: PdfWatermarkOptions) => {
    return watermarkPdf(options);
  });

  // ==================== SETTINGS ====================
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET_ALL, async () => {
    return loadSettings();
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE, async (_, partial) => {
    return saveSettings(partial);
  });

  // ==================== HISTORY ====================
  ipcMain.handle(IPC_CHANNELS.HISTORY_GET_ALL, async () => {
    return getHistory();
  });

  ipcMain.handle(IPC_CHANNELS.HISTORY_CLEAR, async () => {
    return clearHistory();
  });

  ipcMain.handle(IPC_CHANNELS.HISTORY_REMOVE_ITEM, async (_, id: string) => {
    return removeHistoryItem(id);
  });

  // ==================== SHELL ====================
  ipcMain.handle(IPC_CHANNELS.SHELL_SHOW_ITEM_IN_FOLDER, async (_, filePath: string) => {
    try {
      if (!filePath) return;
      const resolved = path.resolve(filePath);
      shell.showItemInFolder(resolved);
    } catch (err) {
      console.error('Failed to show item in folder:', err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.SHELL_OPEN_PATH, async (_, filePath: string) => {
    try {
      if (!filePath) return 'No file path provided';
      const resolved = path.resolve(filePath);
      return await shell.openPath(resolved);
    } catch (err: any) {
      console.error('Failed to open path:', err);
      return err?.message || 'Failed to open file';
    }
  });

  // ==================== WINDOW CONTROLS ====================
  ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.minimize();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.close();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return win?.isMaximized() ?? false;
  });
}
