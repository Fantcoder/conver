import { AppSettings, ElectronAPI, FileItem, HistoryItem, JobStatus } from '../shared/types';
import { getCapabilitiesForFile } from '../main/conversion/registry';

if (typeof window !== 'undefined' && !window.convertFlow) {
  console.log('🌐 ConvertFlow: Initializing Browser Mock Bridge for Web Testing & Demo');

  const progressListeners = new Set<(p: { jobId: string; progress: number; stage?: string }) => void>();
  const statusListeners = new Set<(s: { jobId: string; status: JobStatus; outputPath?: string; outputSize?: number; error?: string }) => void>();

  const DEFAULT_SETTINGS: AppSettings = {
    theme: 'dark',
    outputDirectory: '',
    overwriteExisting: false,
    openFolderOnFinish: false,
    soundEnabled: true,
    hapticEnabled: true,
    defaultImageQuality: 85,
    defaultAudioBitrate: '192k',
    defaultVideoQuality: '1080p',
    autoClearCompleted: false,
    keepOriginalDate: true,
  };

  const getStoredSettings = (): AppSettings => {
    try {
      const data = localStorage.getItem('convertflow_settings');
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  };

  const getStoredHistory = (): HistoryItem[] => {
    try {
      const data = localStorage.getItem('convertflow_history');
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  };

  function createValidPdfBlob(filename: string): Blob {
    const cleanName = filename.replace(/[()\\/]/g, ' ');
    const dateStr = new Date().toLocaleString();
    const streamContent = `BT\n/F1 22 Tf\n50 720 Td\n(ConvertFlow — Universal Studio) Tj\n/F1 14 Tf\n0 -36 Td\n(Converted Document: ${cleanName}) Tj\n/F1 11 Tf\n0 -24 Td\n(Processed: ${dateStr}) Tj\n0 -20 Td\n(Status: Verification Passed - 100% Fidelity) Tj\nET`;

    const streamLen = streamContent.length;
    const header = '%PDF-1.4\n';
    const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
    const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
    const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';
    const obj4 = `4 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamContent}\nendstream\nendobj\n`;
    const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';

    const o1Offset = header.length;
    const o2Offset = o1Offset + obj1.length;
    const o3Offset = o2Offset + obj2.length;
    const o4Offset = o3Offset + obj3.length;
    const o5Offset = o4Offset + obj4.length;
    const xrefOffset = o5Offset + obj5.length;

    const pad = (n: number) => n.toString().padStart(10, '0');
    const xref = `xref\n0 6\n0000000000 65535 f \r\n${pad(o1Offset)} 00000 n \r\n${pad(o2Offset)} 00000 n \r\n${pad(o3Offset)} 00000 n \r\n${pad(o4Offset)} 00000 n \r\n${pad(o5Offset)} 00000 n \r\n`;

    const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    const fullPdf = header + obj1 + obj2 + obj3 + obj4 + obj5 + xref + trailer;
    return new Blob([fullPdf], { type: 'application/pdf' });
  }

  function createSampleImageBlob(filename: string, ext: string): Blob {
    const cleanName = filename.replace(/[<>&"']/g, '');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0b0f19" />
          <stop offset="60%" stop-color="#151b2e" />
          <stop offset="100%" stop-color="#2a163d" />
        </linearGradient>
        <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#6366f1" />
          <stop offset="50%" stop-color="#8b5cf6" />
          <stop offset="100%" stop-color="#d946ef" />
        </linearGradient>
      </defs>
      <rect width="960" height="540" fill="url(#bg)" />
      <circle cx="480" cy="220" r="140" fill="url(#primaryGrad)" opacity="0.22" />
      <rect x="360" y="110" width="240" height="40" rx="20" fill="rgba(255, 255, 255, 0.06)" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1.5" />
      <text x="480" y="135" fill="#a5b4fc" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="13" font-weight="600" text-anchor="middle" letter-spacing="1.5">CONVERTFLOW STUDIO</text>
      <text x="480" y="240" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="34" font-weight="800" text-anchor="middle">Conversion Complete</text>
      <text x="480" y="280" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="16" text-anchor="middle">${cleanName}</text>
      <rect x="330" y="330" width="130" height="36" rx="18" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(16, 185, 129, 0.4)" stroke-width="1" />
      <text x="395" y="353" fill="#34d399" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="13" font-weight="600" text-anchor="middle">FORMAT: ${ext.toUpperCase()}</text>
      <rect x="480" y="330" width="150" height="36" rx="18" fill="rgba(99, 102, 241, 0.15)" stroke="rgba(99, 102, 241, 0.4)" stroke-width="1" />
      <text x="555" y="353" fill="#818cf8" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="13" font-weight="600" text-anchor="middle">OPTIMIZED -65%</text>
      <text x="480" y="470" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="12" text-anchor="middle">Converted via ConvertFlow Local Engine • ${new Date().toLocaleDateString()}</text>
    </svg>`;
    return new Blob([svg], { type: 'image/svg+xml' });
  }

  function createSampleTextBlob(filename: string, ext: string): Blob {
    const cleanName = filename.replace(/[\\/]/g, ' ');
    if (ext === 'json') {
      const json = JSON.stringify(
        {
          application: 'ConvertFlow Universal File & PDF Studio',
          convertedFile: cleanName,
          format: 'JSON',
          timestamp: new Date().toISOString(),
          status: 'success',
          records: [
            { id: 1, item: 'Executive Summary', status: 'verified', sizeKb: 837 },
            { id: 2, item: 'Financial Metrics', status: 'verified', sizeKb: 412 },
            { id: 3, item: 'Vector Assets', status: 'verified', sizeKb: 128 },
          ],
        },
        null,
        2
      );
      return new Blob([json], { type: 'application/json' });
    }

    if (ext === 'csv') {
      const csv = `id,name,category,status,size_kb,converted_date\n1,${cleanName},document,success,837,${new Date().toISOString()}\n2,sample-item-2,data,success,412,${new Date().toISOString()}`;
      return new Blob([csv], { type: 'text/csv' });
    }

    if (ext === 'html') {
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${cleanName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f8fafc; padding: 40px; display: flex; justify-content: center; }
    .card { background: #131b2e; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; max-width: 600px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    h1 { color: #818cf8; margin-top: 0; }
    .badge { display: inline-block; background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">CONVERTFLOW CONVERTED DOCUMENT</div>
    <h1>${cleanName}</h1>
    <p>This document was converted successfully using the ConvertFlow local processing pipeline.</p>
    <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>`;
      return new Blob([html], { type: 'text/html' });
    }

    const text = `# ${cleanName}\n\nConverted successfully with ConvertFlow Universal Studio.\n\nDate: ${new Date().toLocaleString()}\nFormat: ${ext.toUpperCase()}\nStatus: Verified Complete`;
    return new Blob([text], { type: 'text/plain' });
  }

  function getOrCreateMockBlob(filePath: string): { blob: Blob; filename: string } {
    const filename = filePath.split(/[\\/]/).pop() || 'converted-file.pdf';
    const ext = (filename.split('.').pop() || 'pdf').toLowerCase();

    if (ext === 'pdf') {
      return { blob: createValidPdfBlob(filename), filename };
    }
    if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp', 'avif', 'ico'].includes(ext)) {
      return { blob: createSampleImageBlob(filename, ext), filename };
    }
    return { blob: createSampleTextBlob(filename, ext), filename };
  }

  const browserFileStore = new Map<string, File>();

  const mockApi: ElectronAPI = {
    selectFiles: async (options) => {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = Boolean(options?.multiple);
        input.onchange = (e: any) => {
          const files = Array.from(e.target.files as FileList);
          if (files.length > 0) {
            files.forEach((f) => browserFileStore.set(f.name, f));
            resolve(files.map((f) => f.name));
          } else {
            resolve(null);
          }
        };
        input.oncancel = () => resolve(null);
        input.click();
      });
    },

    selectDirectory: async () => '',

    inspectFile: async (filePath: string): Promise<FileItem> => {
      const fileName = filePath.split(/[\\/]/).pop() || filePath;
      const stored = browserFileStore.get(fileName);
      const ext = (fileName.split('.').pop() || 'dat').toLowerCase();
      const isPng = ext === 'png';
      const isPdf = ext === 'pdf';
      const isImg = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg', 'avif', 'tiff', 'ico'].includes(ext);

      return {
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: fileName,
        path: filePath,
        size: stored ? stored.size : (isPng ? 512000 : isPdf ? 1024000 : 256000),
        extension: ext,
        mimeType: stored?.type || (isPng ? 'image/png' : isPdf ? 'application/pdf' : 'application/octet-stream'),
        category: isPdf ? 'pdf' : isImg ? 'image' : 'document',
        lastModified: stored ? stored.lastModified : Date.now(),
        dimensions: isImg ? { width: 1920, height: 1080 } : undefined,
        pageCount: isPdf ? 1 : undefined,
      };
    },

    inspectFiles: async (filePaths: string[]) => {
      return Promise.all(filePaths.map((fp) => mockApi.inspectFile(fp)));
    },

    getCapabilities: async (file: FileItem) => {
      return getCapabilitiesForFile(file);
    },

    startJob: async ({ file, capability, options: _options }) => {
      const jobId = 'job-' + Math.random().toString(36).substring(2, 9);
      const targetExt = capability.targetExtension || 'webp';
      const outName = `${file.name.replace(/\.[^/.]+$/, '')}.${targetExt}`;
      const outputPath = outName;
      const outputSize = Math.max(1024, Math.round(file.size * 0.4));

      let step = 15;
      const interval = setInterval(() => {
        step += 25;
        if (step < 100) {
          progressListeners.forEach((fn) =>
            fn({ jobId, progress: step, stage: `Transforming ${capability.targetFormat} (${step}%)...` })
          );
        } else {
          clearInterval(interval);
          progressListeners.forEach((fn) =>
            fn({ jobId, progress: 100, stage: 'Finalizing converted file...' })
          );

          statusListeners.forEach((fn) =>
            fn({
              jobId,
              status: 'completed',
              outputPath,
              outputSize,
            })
          );

          // Add to local history
          const history = getStoredHistory();
          history.unshift({
            id: jobId,
            sourceName: file.name,
            sourcePath: file.path,
            sourceSize: file.size,
            sourceFormat: file.extension.toUpperCase(),
            targetFormat: capability.targetFormat,
            outputPath,
            outputSize,
            operationLabel: capability.label,
            completedAt: Date.now(),
            status: 'completed',
          });
          localStorage.setItem('convertflow_history', JSON.stringify(history.slice(0, 100)));
        }
      }, 300);

      return jobId;
    },

    cancelJob: async () => true,

    onJobProgress: (callback) => {
      progressListeners.add(callback);
      return () => { progressListeners.delete(callback); };
    },

    onJobStatus: (callback) => {
      statusListeners.add(callback);
      return () => { statusListeners.delete(callback); };
    },

    getPdfDetails: async () => ({
      pageCount: 1,
      title: 'PDF Document',
      author: 'User',
      isEncrypted: false,
      pageSize: { width: 595, height: 842 },
    }),

    mergePdfs: async (options) => {
      return options.outputPath || 'merged-document.pdf';
    },

    splitPdf: async (options) => {
      return [
        `${options.outputDir || ''}\\split-page-1.pdf`,
        `${options.outputDir || ''}\\split-page-2.pdf`,
      ];
    },

    rotatePdf: async (options) => options.outputPath,
    watermarkPdf: async (options) => options.outputPath,
    encryptPdf: async (options) => options.outputPath,

    getSettings: async () => getStoredSettings(),
    updateSettings: async (partial) => {
      const updated = { ...getStoredSettings(), ...partial };
      localStorage.setItem('convertflow_settings', JSON.stringify(updated));
      return updated;
    },
    chooseOutputDir: async () => '',

    getHistory: async () => getStoredHistory(),
    clearHistory: async () => {
      localStorage.removeItem('convertflow_history');
      return true;
    },
    removeHistoryItem: async (id) => {
      const hist = getStoredHistory().filter((h) => h.id !== id);
      localStorage.setItem('convertflow_history', JSON.stringify(hist));
      return true;
    },

    showItemInFolder: async (fp: string) => {
      console.log('🌐 ConvertFlow: Showing file in folder (triggering browser download):', fp);
      try {
        const item = getOrCreateMockBlob(fp);
        const blobUrl = URL.createObjectURL(item.blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = item.filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        }, 1500);
      } catch (err) {
        console.error('Failed to trigger download in browser mock:', err);
      }
    },

    openPath: async (fp: string) => {
      console.log('🌐 ConvertFlow: Opening file in browser:', fp);
      try {
        const item = getOrCreateMockBlob(fp);
        const blobUrl = URL.createObjectURL(item.blob);

        // Attempt opening in a new tab first
        const opened = window.open(blobUrl, '_blank');

        // If popup was blocked or window returned null, trigger download link directly
        if (!opened || opened.closed || typeof opened.closed === 'undefined') {
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = item.filename;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
          }, 1500);
        }
        return '';
      } catch (err: any) {
        console.error('Failed to open file in browser:', err);
        return err?.message || 'Failed to open file';
      }
    },

    minimizeWindow: async () => console.log('Minimize window'),
    maximizeWindow: async () => console.log('Maximize window'),
    closeWindow: async () => console.log('Close window'),
    isMaximized: async () => false,
  };

  (window as any).convertFlow = mockApi;
}
