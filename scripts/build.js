import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('src', 'dist', { recursive: true });

// Inject build metadata for deployment verification
const commit = (() => {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
})();

const buildTime = new Date().toISOString();

const buildMeta = {
  commit,
  buildTime,
  version: process.env.npm_package_version || '0.0.0',
  ci: process.env.CI || 'local',
};

await writeFile('dist/build.json', JSON.stringify(buildMeta, null, 2));
console.log(`Build completed: src/ -> dist/ [${commit}] ${buildTime}`);
