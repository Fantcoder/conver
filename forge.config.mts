import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import path from 'node:path';
import fs from 'node:fs/promises';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

const copyNativeDependencies = async (
  _forgeConfig: unknown,
  buildPath: string,
) => {
  const targetModulesDir = path.join(buildPath, 'node_modules');
  await fs.mkdir(targetModulesDir, { recursive: true });

  const modulesToCopy = ['sharp', '@img', 'detect-libc', 'semver'];

  for (const mod of modulesToCopy) {
    const src = path.join(process.cwd(), 'node_modules', mod);
    const dest = path.join(targetModulesDir, mod);
    try {
      await fs.cp(src, dest, { recursive: true, dereference: true });
    } catch (err) {
      console.warn(`[forge.config] Warning copying ${mod}:`, err);
    }
  }
};

const config: ForgeConfig = {
  packagerConfig: {
    asar: {
      unpack:
        '{**/node_modules/sharp/**/*,**/node_modules/@img/**/*,**/*.node,**/*.dll}',
    },
    name: 'ConvertFlow',
    executableName: 'ConvertFlow',
    prune: false,
  },
  rebuildConfig: {},
  hooks: {
    packageAfterCopy: copyNativeDependencies,
    packageAfterPrune: copyNativeDependencies,
  },
  makers: [
    new MakerSquirrel({}),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/index.html',
            js: './src/renderer.tsx',
            name: 'main_window',
            preload: {
              js: './src/preload.ts',
            },
          },
        ],
      },
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
