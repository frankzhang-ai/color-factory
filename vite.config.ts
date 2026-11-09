import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
function precachePlugin(outDir: string, cachePrefix: string, preview: boolean): Plugin {
  return {
    name: 'color-factory-precache',
    async closeBundle() {
      const directory = resolve(outDir);
      const { readdir } = await import('node:fs/promises');
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
      if (preview || cachePrefix === 'cfcool-') {
        const manifestPath = resolve(directory, 'manifest.webmanifest');
        const manifest = await readFile(manifestPath, 'utf8');
        const cool = cachePrefix === 'cfcool-';
        const name = cool ? 'Color Factory (Cool Preview)' : 'Color Factory (Preview)';
        const themed = manifest.replace('"name":"COLOR FACTORY"', `"name":"${name}"`);
        await writeFile(manifestPath, cool ? themed.replaceAll('#FAF7F0', '#070b18') : themed);
      }
    },
  };
}
export default defineConfig(({ mode }) => {
  const preview = mode === 'preview';
  const cool = mode === 'cool';
  const outDir = cool ? 'dist-cool' : preview ? 'dist-preview' : 'dist';
  const cachePrefix = cool ? 'cfcool-' : preview ? 'cfpreview-' : 'colorfactory-';
  return {
  base: cool ? '/color-factory/preview-cool/' : preview ? '/color-factory/preview/' : './',
  plugins: [precachePlugin(outDir, cachePrefix, preview)],
  build: {
    outDir,
    chunkSizeWarningLimit: 2000,
  },
  };
});
