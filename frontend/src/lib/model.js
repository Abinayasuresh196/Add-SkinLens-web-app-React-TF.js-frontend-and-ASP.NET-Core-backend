import * as tf from '@tensorflow/tfjs';

// Model + labels are served from /model by default (copied from the repo root at build time).
// To host them elsewhere (e.g. GitHub raw), set VITE_MODEL_URL to the full model.json URL.
const MODEL_URL = import.meta.env.VITE_MODEL_URL || '/model/model.json';
const LABELS_URL = MODEL_URL.replace(/model\.json(\?.*)?$/, 'labels.json');
export const MODEL_VERSION = 'efficientnetb3-ham10000-v1';

let loading = null;

/** Loads labels + model once. onProgress receives a 0..1 fraction while weights download. */
export function loadModel(onProgress) {
  if (!loading) {
    loading = (async () => {
      const labelsRes = await fetch(LABELS_URL);
      const isJson = (labelsRes.headers.get('content-type') || '').includes('json');
      if (!labelsRes.ok || !isJson) {
        throw new Error(
          `Model files not found at ${LABELS_URL}. Put model.json, the 6 shard .bin files and labels.json ` +
          'in the project root (next to the frontend folder) and restart npm run dev.',
        );
      }
      const labels = await labelsRes.json();

      await tf.ready();
      const model = await tf.loadGraphModel(MODEL_URL, { onProgress });

      // Warm-up run so the first real prediction is fast
      const { width, height } = labels.input;
      tf.tidy(() => model.predict(tf.zeros([1, height, width, 3])));
      return { model, labels, backend: tf.getBackend() };
    })().catch((err) => {
      loading = null; // allow retry
      throw err;
    });
  }
  return loading;
}

/**
 * Runs the same preprocessing as training:
 * RGB, bilinear resize (half-pixel centers, like tf.image.resize) to 300x300, float32 0-255, no normalisation.
 * Then applies the per-class decision multipliers from labels.json and renormalises.
 */
export async function classify(imageEl) {
  const { model, labels } = await loadModel();
  const { width, height } = labels.input;

  const raw = tf.tidy(() => {
    const pixels = tf.browser.fromPixels(imageEl, 3).toFloat();
    const resized = tf.image.resizeBilinear(pixels, [height, width], false, true);
    return model.predict(resized.expandDims(0));
  });
  const probs = Array.from(await raw.data());
  raw.dispose();

  const weighted = probs.map((p, i) => p * labels.classes[i].decision_multiplier);
  const total = weighted.reduce((a, b) => a + b, 0);
  const adjusted = weighted.map((v) => v / total);

  const ranked = labels.classes
    .map((c) => ({ ...c, probability: adjusted[c.index], rawProbability: probs[c.index] }))
    .sort((a, b) => b.probability - a.probability);

  return { top: ranked[0], ranked, adjusted, raw: probs };
}

/** Center-cropped square JPEG thumbnail as a data URL (~8-12 KB). */
export function makeThumbnail(imageEl, size = 160) {
  const w = imageEl.naturalWidth || imageEl.width;
  const h = imageEl.naturalHeight || imageEl.height;
  const side = Math.min(w, h);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  canvas.getContext('2d').drawImage(imageEl, (w - side) / 2, (h - side) / 2, side, side, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', 0.72);
}
