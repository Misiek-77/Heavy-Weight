/**
 * Imports illustrations made outside the API script (for example in the Gemini app) into public/exercises.
 *
 *   node scripts/import-illustrations.mjs <folder> [exercise-id ...]
 *
 * Reads <folder>/trening-<exercise-id>.jpg, trims the empty background around the drawing so the figures fill
 * the frame, pads it back to 4:3 and writes public/exercises/<exercise-id>.jpg. Then rebuilds the manifest.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Jimp } from 'jimp';
import { POSES } from './illustration-poses.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
/** `--muscles` imports muscle charts (trening-muscles-<id>.jpg) into public/exercises/muscles instead. */
const MUSCLES = process.argv.includes('--muscles');
const OUT_DIR = MUSCLES ? join(ROOT, 'public', 'exercises', 'muscles') : join(ROOT, 'public', 'exercises');
const PREFIX = MUSCLES ? 'trening-muscles-' : 'trening-';
const WIDTH = 960;
const HEIGHT = 717;
/** Empty space kept around the drawing, as a share of its larger side. */
const MARGIN = 0.05;

const [folder, ...only] = process.argv.slice(2).filter((a) => a !== '--muscles');
if (!folder) throw new Error('Usage: node scripts/import-illustrations.mjs <folder> [exercise-id ...]');

/** Bounding box of everything that differs clearly from the background colour in the top-left corner. */
function contentBox(image) {
  const { data, width, height } = image.bitmap;
  const [r0, g0, b0] = data;
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (Math.abs(data[i] - r0) + Math.abs(data[i + 1] - g0) + Math.abs(data[i + 2] - b0) > 60) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  if (right < 0) return { left: 0, top: 0, w: width, h: height };
  return { left, top, w: right - left + 1, h: bottom - top + 1 };
}

async function importOne(key) {
  const image = await Jimp.fromBuffer(readFileSync(join(folder, `${PREFIX}${key}.jpg`)));
  const box = contentBox(image);
  const background = image.getPixelColor(0, 0);
  const pad = Math.round(Math.max(box.w, box.h) * MARGIN);
  // Smallest 4:3 canvas that holds the drawing plus its margin.
  let w = box.w + pad * 2;
  let h = box.h + pad * 2;
  if (w / h > WIDTH / HEIGHT) h = Math.round((w * HEIGHT) / WIDTH);
  else w = Math.round((h * WIDTH) / HEIGHT);
  const canvas = new Jimp({ width: w, height: h, color: background });
  const drawing = image.clone().crop({ x: box.left, y: box.top, w: box.w, h: box.h });
  canvas.composite(drawing, Math.round((w - box.w) / 2), Math.round((h - box.h) / 2));
  canvas.resize({ w: WIDTH, h: HEIGHT });
  writeFileSync(join(OUT_DIR, `${key}.jpg`), await canvas.getBuffer('image/jpeg', { quality: 84 }));
  return Math.round(((box.w * box.h) / (image.width * image.height)) * 100);
}

mkdirSync(OUT_DIR, { recursive: true });
const keys = (only.length ? only : readdirSync(folder).map((f) => (f.startsWith(PREFIX) ? /^(.+).jpg$/.exec(f.slice(PREFIX.length))?.[1] : undefined))).filter(
  (k) => k && k in POSES && existsSync(join(folder, `${PREFIX}${k}.jpg`)),
);
for (const key of keys) console.log(`${key}: drawing covered ${await importOne(key)}% of the source`);
if (!MUSCLES) execFileSync(process.execPath, [join(ROOT, 'scripts', 'make-thumbnails.mjs'), ...keys], { stdio: 'inherit' });
execFileSync(process.execPath, [join(ROOT, 'scripts', 'generate-illustrations.mjs'), '--manifest'], { stdio: 'inherit' });
