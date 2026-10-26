// Copies the TF.js model (model.json + shards) and labels.json from the repo root
// into public/model so Vite serves them at /model/... in dev and bundles them in builds.
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const outDir = resolve(here, '..', 'public', 'model');
mkdirSync(outDir, { recursive: true });

const modelJson = join(repoRoot, 'model.json');
if (!existsSync(modelJson)) {
  console.warn('[copy-model] model.json not found in repo root. Set VITE_MODEL_URL to a hosted model instead.');
  process.exit(0);
}

const shards = JSON.parse(readFileSync(modelJson, 'utf8')).weightsManifest.flatMap((g) => g.paths);
for (const file of ['model.json', 'labels.json', ...shards]) {
  copyFileSync(join(repoRoot, file), join(outDir, file));
}
console.log(`[copy-model] Copied model.json, labels.json and ${shards.length} weight shards to public/model`);
