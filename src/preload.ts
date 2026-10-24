import { contextBridge, ipcRenderer, webUtils } from 'electron';
import { IPC_CHANNELS } from './shared/ipc-channels';
import { ElectronAPI } from './shared/types';

const api: ElectronAPI = {
  // File operations
  selectFiles: (options) =>
    ipcRenderer.invoke(IPC_CHANNELS.FILE_SELECT_DIALOG, options),
  selectDirectory: () =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_CHOOSE_OUTPUT_DIR),
  inspectFile: (filePath) =>
    ipcRenderer.invoke(IPC_CHANNELS.FILE_INSPECT, filePath),
  inspectFiles: (filePaths) =>
    ipcRenderer.invoke(IPC_CHANNELS.FILE_INSPECT_MANY, filePaths),
  getPathForFile: (file: File) => webUtils.getPathForFile(file),

  // Capabilities & Conversion
  getCapabilities: (file) =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_CAPABILITIES, file),
  startJob: (payload) => ipcRenderer.invoke(IPC_CHANNELS.START_JOB, payload),
  cancelJob: (jobId) => ipcRenderer.invoke(IPC_CHANNELS.CANCEL_JOB, jobId),

  onJobProgress: (callback) => {
    const subscription = (_: any, payload: any) => callback(payload);
    ipcRenderer.on(IPC_CHANNELS.ON_JOB_PROGRESS, subscription);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.ON_JOB_PROGRESS, subscription);
    };
  },

  onJobStatus: (callback) => {
    const subscription = (_: any, payload: any) => callback(payload);
    ipcRenderer.on(IPC_CHANNELS.ON_JOB_STATUS, subscription);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.ON_JOB_STATUS, subscription);
    };
  },

  // PDF
  getPdfDetails: (filePath) =>
    ipcRenderer.invoke(IPC_CHANNELS.PDF_GET_DETAILS, filePath),
  mergePdfs: (options) => ipcRenderer.invoke(IPC_CHANNELS.PDF_MERGE, options),
  splitPdf: (options) => ipcRenderer.invoke(IPC_CHANNELS.PDF_SPLIT, options),
  rotatePdf: (options) => ipcRenderer.invoke(IPC_CHANNELS.PDF_ROTATE, options),
  watermarkPdf: (options) =>
    ipcRenderer.invoke(IPC_CHANNELS.PDF_WATERMARK, options),
  encryptPdf: (options) =>
    ipcRenderer.invoke(IPC_CHANNELS.PDF_ENCRYPT, options),

  // Settings
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET_ALL),
  updateSettings: (partial) =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_UPDATE, partial),
  chooseOutputDir: () =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_CHOOSE_OUTPUT_DIR),

  // History
  getHistory: () => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_GET_ALL),
  clearHistory: () => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_CLEAR),
  removeHistoryItem: (id) =>
    ipcRenderer.invoke(IPC_CHANNELS.HISTORY_REMOVE_ITEM, id),

  // Shell
  showItemInFolder: (filePath) =>
    ipcRenderer.invoke(IPC_CHANNELS.SHELL_SHOW_ITEM_IN_FOLDER, filePath),
  openPath: (filePath) =>
    ipcRenderer.invoke(IPC_CHANNELS.SHELL_OPEN_PATH, filePath),
  saveFileAs: (sourcePath) =>
    ipcRenderer.invoke(IPC_CHANNELS.FILE_SAVE_COPY, sourcePath),

  // Window Controls
  minimizeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MINIMIZE),
  maximizeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MAXIMIZE),
  closeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE),
  isMaximized: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_IS_MAXIMIZED),
};

contextBridge.exposeInMainWorld('convertFlow', api);
