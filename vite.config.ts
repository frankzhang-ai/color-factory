import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
function precachePlugin(): Plugin {
  return {
    name: 'color-factory-precache',
    async closeBundle() {
      const directory = resolve('dist');
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
        .replace('self.__PRECACHE__ = [];', `self.__PRECACHE__ = ${JSON.stringify([...paths, './'])};`);
      await writeFile(resolve(directory, 'sw.js'), output);
    },
  };
}
export default defineConfig({
  base: './',
  plugins: [precachePlugin()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000,
  },
});
