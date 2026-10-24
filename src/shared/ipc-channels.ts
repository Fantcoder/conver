export const IPC_CHANNELS = {
  // File System & Inspection
  FILE_SELECT_DIALOG: 'file:select-dialog',
  FILE_INSPECT: 'file:inspect',
  FILE_INSPECT_MANY: 'file:inspect-many',
  FILE_GET_THUMBNAIL: 'file:get-thumbnail',

  // Capabilities & Conversion
  GET_CAPABILITIES: 'convert:get-capabilities',
  START_JOB: 'convert:start-job',
  CANCEL_JOB: 'convert:cancel-job',
  ON_JOB_PROGRESS: 'convert:on-progress',
  ON_JOB_STATUS: 'convert:on-status',

  // PDF Toolkit
  PDF_GET_DETAILS: 'pdf:get-details',
  PDF_MERGE: 'pdf:merge',
  PDF_SPLIT: 'pdf:split',
  PDF_ROTATE: 'pdf:rotate',
  PDF_WATERMARK: 'pdf:watermark',
  PDF_ENCRYPT: 'pdf:encrypt',
  PDF_EXTRACT_PAGES: 'pdf:extract-pages',

  // Settings
  SETTINGS_GET_ALL: 'settings:get-all',
  SETTINGS_UPDATE: 'settings:update',
  SETTINGS_CHOOSE_OUTPUT_DIR: 'settings:choose-output-dir',

  // History
  HISTORY_GET_ALL: 'history:get-all',
  HISTORY_CLEAR: 'history:clear',
  HISTORY_REMOVE_ITEM: 'history:remove-item',

  // Shell / OS Integration
  SHELL_SHOW_ITEM_IN_FOLDER: 'shell:show-item-in-folder',
  SHELL_OPEN_PATH: 'shell:open-path',

  // Window Controls (Custom TitleBar)
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_IS_MAXIMIZED: 'window:is-maximized',
} as const;
