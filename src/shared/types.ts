export type FileCategory =
  | 'image'
  | 'pdf'
  | 'video'
  | 'audio'
  | 'document'
  | 'archive'
  | 'data'
  | 'code'
  | 'other';

export interface FileItem {
  id: string;
  name: string;
  path: string;
  size: number;
  extension: string;
  mimeType: string;
  category: FileCategory;
  lastModified: number;
  previewUrl?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  pageCount?: number;
  duration?: number;
}

export type OperationCategory =
  | 'convert'
  | 'compress'
  | 'extract'
  | 'merge'
  | 'split'
  | 'edit'
  | 'security'
  | 'ocr';

export interface ConversionOptionDef {
  id: string;
  label: string;
  type: 'select' | 'slider' | 'toggle' | 'text' | 'number';
  defaultValue: any;
  options?: { label: string; value: any }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  description?: string;
}

export interface ConversionCapability {
  id: string;
  label: string;
  category: OperationCategory;
  targetFormat: string;
  targetExtension: string;
  targetMimeType: string;
  icon: string;
  description: string;
  estimatedSpeed: 'instant' | 'fast' | 'moderate' | 'slow';
  lossless: boolean;
  badge?: string;
  priority: number;
  options?: ConversionOptionDef[];
}

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface ConversionJob {
  id: string;
  sourceFile: FileItem;
  capability: ConversionCapability;
  targetFormat: string;
  status: JobStatus;
  progress: number; // 0 - 100
  stage?: string;
  outputPath?: string;
  outputSize?: number;
  error?: string;
  options: Record<string, any>;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  outputDirectory: string; // empty means same as source
  overwriteExisting: boolean;
  openFolderOnFinish: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  defaultImageQuality: number; // 1 - 100
  defaultAudioBitrate: string; // '128k', '192k', '320k'
  defaultVideoQuality: string; // 'copy', '1080p', '720p', '480p'
  autoClearCompleted: boolean;
  keepOriginalDate: boolean;
}

export interface HistoryItem {
  id: string;
  sourceName: string;
  sourcePath: string;
  sourceSize: number;
  sourceFormat: string;
  targetFormat: string;
  outputPath: string;
  outputSize: number;
  operationLabel: string;
  completedAt: number;
  status: 'completed' | 'failed';
  error?: string;
}

export interface PdfDetails {
  pageCount: number;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  isEncrypted: boolean;
  pageSize?: {
    width: number;
    height: number;
  };
}

export interface PdfMergeOptions {
  files: string[];
  outputPath: string;
}

export interface PdfSplitOptions {
  filePath: string;
  outputDir: string;
  mode: 'all' | 'ranges' | 'extract';
  ranges?: string; // e.g. "1-3, 5, 7-10"
}

export interface PdfRotateOptions {
  filePath: string;
  outputPath: string;
  degrees: 90 | 180 | 270;
  pages?: number[]; // empty = all
}

export interface PdfWatermarkOptions {
  filePath: string;
  outputPath: string;
  text: string;
  opacity?: number;
  fontSize?: number;
  color?: string;
  angle?: number;
}

export interface PdfEncryptOptions {
  filePath: string;
  outputPath: string;
  userPassword?: string;
  ownerPassword?: string;
}

export interface ElectronAPI {
  // File operations
  selectFiles: (options?: { multiple?: boolean; filters?: { name: string; extensions: string[] }[] }) => Promise<string[] | null>;
  selectDirectory: () => Promise<string | null>;
  inspectFile: (filePath: string) => Promise<FileItem>;
  inspectFiles: (filePaths: string[]) => Promise<FileItem[]>;

  // Capabilities & Conversion
  getCapabilities: (file: FileItem) => Promise<ConversionCapability[]>;
  startJob: (payload: { file: FileItem; capability: ConversionCapability; options: Record<string, any> }) => Promise<string>;
  cancelJob: (jobId: string) => Promise<boolean>;
  onJobProgress: (callback: (payload: { jobId: string; progress: number; stage?: string }) => void) => () => void;
  onJobStatus: (callback: (payload: { jobId: string; status: JobStatus; outputPath?: string; outputSize?: number; error?: string }) => void) => () => void;

  // PDF
  getPdfDetails: (filePath: string) => Promise<PdfDetails>;
  mergePdfs: (options: PdfMergeOptions) => Promise<string>;
  splitPdf: (options: PdfSplitOptions) => Promise<string[]>;
  rotatePdf: (options: PdfRotateOptions) => Promise<string>;
  watermarkPdf: (options: PdfWatermarkOptions) => Promise<string>;
  encryptPdf: (options: PdfEncryptOptions) => Promise<string>;

  // Settings
  getSettings: () => Promise<AppSettings>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<AppSettings>;
  chooseOutputDir: () => Promise<string | null>;

  // History
  getHistory: () => Promise<HistoryItem[]>;
  clearHistory: () => Promise<boolean>;
  removeHistoryItem: (id: string) => Promise<boolean>;

  // Shell
  showItemInFolder: (filePath: string) => Promise<void>;
  openPath: (filePath: string) => Promise<string>;

  // Window
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
}

declare global {
  interface Window {
    convertFlow: ElectronAPI;
  }
}
