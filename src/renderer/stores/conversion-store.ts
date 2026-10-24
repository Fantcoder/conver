import { create } from 'zustand';
import confetti from 'canvas-confetti';
import {
  ConversionCapability,
  ConversionJob,
  FileItem,
} from '../../shared/types';

interface ConversionStore {
  files: FileItem[];
  activeFileIndex: number;
  capabilities: ConversionCapability[];
  selectedCapability: ConversionCapability | null;
  options: Record<string, any>;
  activeJob: ConversionJob | null;
  isDragging: boolean;

  // Actions
  setIsDragging: (isDragging: boolean) => void;
  loadFilesFromPaths: (paths: string[]) => Promise<void>;
  selectFileIndex: (index: number) => Promise<void>;
  removeFile: (index: number) => void;
  clearFiles: () => void;
  selectCapability: (cap: ConversionCapability) => void;
  setOption: (key: string, value: any) => void;
  startConversion: () => Promise<void>;
  cancelConversion: () => Promise<void>;
  resetConversion: () => void;
  updateJobProgress: (jobId: string, progress: number, stage?: string) => void;
  updateJobStatus: (payload: {
    jobId: string;
    status: any;
    outputPath?: string;
    outputSize?: number;
    error?: string;
  }) => void;
}

export const useConversionStore = create<ConversionStore>((set, get) => ({
  files: [],
  activeFileIndex: 0,
  capabilities: [],
  selectedCapability: null,
  options: {},
  activeJob: null,
  isDragging: false,

  setIsDragging: (isDragging) => set({ isDragging }),

  loadFilesFromPaths: async (paths: string[]) => {
    if (!paths.length || !window.convertFlow) return;
    try {
      const inspected = await window.convertFlow.inspectFiles(paths);
      if (!inspected.length) return;

      const currentFiles = get().files;
      const combined = [...currentFiles, ...inspected];
      set({
        files: combined,
        activeFileIndex: currentFiles.length,
        activeJob: null,
      });

      // Load capabilities for first new file
      const firstNew = inspected[0];
      const caps = await window.convertFlow.getCapabilities(firstNew);
      const defaultCap = caps.length > 0 ? caps[0] : null;

      // Extract default option values
      const initialOptions: Record<string, any> = {};
      defaultCap?.options?.forEach((opt) => {
        initialOptions[opt.id] = opt.defaultValue;
      });

      set({
        capabilities: caps,
        selectedCapability: defaultCap,
        options: initialOptions,
      });
    } catch (err) {
      console.error('Failed to inspect files:', err);
    }
  },

  selectFileIndex: async (index: number) => {
    const files = get().files;
    if (index < 0 || index >= files.length) return;
    const file = files[index];
    set({ activeFileIndex: index, activeJob: null });

    if (window.convertFlow) {
      const caps = await window.convertFlow.getCapabilities(file);
      const defaultCap = caps.length > 0 ? caps[0] : null;
      const initialOptions: Record<string, any> = {};
      defaultCap?.options?.forEach((opt) => {
        initialOptions[opt.id] = opt.defaultValue;
      });

      set({
        capabilities: caps,
        selectedCapability: defaultCap,
        options: initialOptions,
      });
    }
  },

  removeFile: (index: number) => {
    const files = get().files.filter((_, i) => i !== index);
    const newIdx = Math.max(
      0,
      Math.min(get().activeFileIndex, files.length - 1),
    );
    set({ files, activeFileIndex: newIdx });
    if (files.length > 0) {
      get().selectFileIndex(newIdx);
    } else {
      set({ capabilities: [], selectedCapability: null, activeJob: null });
    }
  },

  clearFiles: () => {
    set({
      files: [],
      activeFileIndex: 0,
      capabilities: [],
      selectedCapability: null,
      options: {},
      activeJob: null,
    });
  },

  selectCapability: (cap: ConversionCapability) => {
    const initialOptions: Record<string, any> = {};
    cap.options?.forEach((opt) => {
      initialOptions[opt.id] = opt.defaultValue;
    });
    set({ selectedCapability: cap, options: initialOptions });
  },

  setOption: (key: string, value: any) => {
    set((state) => ({
      options: { ...state.options, [key]: value },
    }));
  },

  startConversion: async () => {
    const { files, activeFileIndex, selectedCapability, options } = get();
    if (!files.length || !selectedCapability || !window.convertFlow) return;

    const file = files[activeFileIndex];

    const placeholderJob: ConversionJob = {
      id: 'pending',
      sourceFile: file,
      capability: selectedCapability,
      targetFormat: selectedCapability.targetFormat,
      status: 'processing',
      progress: 10,
      stage: 'Preparing conversion...',
      options,
      createdAt: Date.now(),
      startedAt: Date.now(),
    };

    set({ activeJob: placeholderJob });

    try {
      const jobId = await window.convertFlow.startJob({
        file,
        capability: selectedCapability,
        options,
      });

      set((state) => ({
        activeJob: state.activeJob ? { ...state.activeJob, id: jobId } : null,
      }));
    } catch (err: any) {
      set((state) => ({
        activeJob: state.activeJob
          ? {
              ...state.activeJob,
              status: 'failed',
              error: err?.message || 'Failed to start conversion',
            }
          : null,
      }));
    }
  },

  cancelConversion: async () => {
    const job = get().activeJob;
    if (job && window.convertFlow) {
      await window.convertFlow.cancelJob(job.id);
    }
  },

  resetConversion: () => {
    set({ activeJob: null });
  },

  updateJobProgress: (jobId: string, progress: number, stage?: string) => {
    set((state) => {
      if (
        state.activeJob &&
        (state.activeJob.id === jobId || state.activeJob.id === 'pending')
      ) {
        return {
          activeJob: {
            ...state.activeJob,
            progress,
            stage: stage || state.activeJob.stage,
          },
        };
      }
      return state;
    });
  },

  updateJobStatus: (payload) => {
    set((state) => {
      if (
        state.activeJob &&
        (state.activeJob.id === payload.jobId ||
          state.activeJob.id === 'pending')
      ) {
        const isCompleted = payload.status === 'completed';
        if (isCompleted) {
          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.7 },
              colors: ['#6366f1', '#a855f7', '#ec4899', '#10b981'],
            });
          } catch {
            // Ignore confetti in tests/headless
          }
        }

        return {
          activeJob: {
            ...state.activeJob,
            status: payload.status,
            outputPath: payload.outputPath,
            outputSize: payload.outputSize,
            error: payload.error,
            progress: isCompleted ? 100 : state.activeJob.progress,
            completedAt: isCompleted ? Date.now() : state.activeJob.completedAt,
          },
        };
      }
      return state;
    });
  },
}));
