import { webcrypto } from 'node:crypto';

// Set up crypto polyfill
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = webcrypto;
}

// Run the build
import { build } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

build({
  configFile: resolve(__dirname, 'vite.config.ts'),
}); 