import { createHash } from 'node:crypto';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
function precachePlugin(outDir: string, cachePrefix: string, manifestName?: string): Plugin {
  return {
    name: 'color-factory-precache',
    async closeBundle() {
      const directory = resolve(outDir);
      async function walk(folder: string): Promise<string[]> {
        const entries = await readdir(folder, { withFileTypes: true });
        const files = await Promise.all(entries.map((entry) => entry.isDirectory() ? walk(resolve(folder, entry.name)) : [resolve(folder, entry.name)]));
        return files.flat();
      }
      const files = (await walk(directory)).sort();
      const paths = files.map((file) => `./${file.slice(directory.length + 1).replaceAll('\\', '/')}`);
      const hash = createHash('sha1');
      for (const file of files) {
        hash.update(file.slice(directory.length + 1).replaceAll('\\', '/'));
        hash.update(await readFile(file));
      }
      const buildHash = hash.digest('hex').slice(0, 10);
      const serviceWorker = await readFile(resolve('public/sw.js'), 'utf8');
      const output = serviceWorker
        .replace('__BUILD_HASH__', buildHash)
        .replaceAll('__CACHE_PREFIX__', cachePrefix)
        .replace('self.__PRECACHE__ = [];', `self.__PRECACHE__ = ${JSON.stringify([...paths, './'])};`);
      await writeFile(resolve(directory, 'sw.js'), output);
      if (manifestName) {
        const manifestPath = resolve(directory, 'manifest.webmanifest');
        const manifest = await readFile(manifestPath, 'utf8');
        await writeFile(manifestPath, manifest.replace(/"name":"[^"]*"/, `"name":"${manifestName}"`));
      }
    },
  };
}
export default defineConfig(({ mode }) => {
  const preview = mode === 'preview';
  const cute = mode === 'cute';
  const outDir = cute ? 'dist-cute' : preview ? 'dist-preview' : 'dist';
  const cachePrefix = cute ? 'cfcute-' : preview ? 'cfpreview-' : 'colorfactory-';
  return {
  base: cute ? '/color-factory/preview-cute/' : preview ? '/color-factory/preview/' : './',
  plugins: [precachePlugin(outDir, cachePrefix, cute ? 'Color Factory (Cute Preview)' : preview ? 'Color Factory (Preview)' : undefined)],
  build: {
    outDir,
    chunkSizeWarningLimit: 2000,
  },
  };
});
