/**
 * Gives every illustration in public/exercises the same paper colour and brightness.
 *
 *   node scripts/normalize-illustrations.mjs            all illustrations
 *   node scripts/normalize-illustrations.mjs squat      just these
 *   node scripts/normalize-illustrations.mjs --muscles  the muscle charts in public/exercises/muscles
 *
 * The images come from different generator sessions, so their off-white backgrounds differ slightly
 * and some are darker overall. Each image is white-balanced so that its own background lands exactly
 * on PAPER, and whatever is left of the background texture is flattened to that colour. Running it
 * again on an already normalised image changes nothing visible.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Jimp } from 'jimp';

const MUSCLES = process.argv.includes('--muscles');
const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'exercises', ...(MUSCLES ? ['muscles'] : []));
/** Must match the background the app draws behind illustrations (see `.guide-image` in app.css). */
const PAPER = [247, 247, 243];
/** Pixels this close to the paper colour after balancing are treated as background. */
const FLATTEN_WITHIN = 14;

const median = (values) => values.sort((a, b) => a - b)[Math.floor(values.length / 2)];

/** Median colour of the outer frame of the image, which is always background. */
function background({ data, width, height }) {
  const frame = Math.max(2, Math.round(Math.min(width, height) * 0.02));
  const channels = [[], [], []];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x >= frame && x < width - frame && y >= frame && y < height - frame) continue;
      const i = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) channels[c].push(data[i + c]);
    }
  }
  return channels.map(median);
}

async function normalize(file) {
  const path = join(DIR, file);
  const image = await Jimp.fromBuffer(readFileSync(path));
  const { data } = image.bitmap;
  const bg = background(image.bitmap);
  const gain = bg.map((value, c) => PAPER[c] / Math.max(1, value));
  for (let i = 0; i < data.length; i += 4) {
    let distance = 0;
    for (let c = 0; c < 3; c++) {
      const value = Math.min(255, Math.round(data[i + c] * gain[c]));
      data[i + c] = value;
      distance = Math.max(distance, Math.abs(value - PAPER[c]));
    }
    if (distance <= FLATTEN_WITHIN) for (let c = 0; c < 3; c++) data[i + c] = PAPER[c];
  }
  writeFileSync(path, await image.getBuffer('image/jpeg', { quality: 86 }));
  return bg;
}

const only = process.argv.slice(2).filter((a) => a !== '--muscles');
const files = readdirSync(DIR).filter((f) => f.endsWith('.jpg') && (only.length === 0 || only.includes(f.slice(0, -4))));
for (const file of files) {
  const bg = await normalize(file);
  console.log(`${file.padEnd(34)} background was rgb(${bg.join(', ')})`);
}
console.log(`${files.length} illustrations normalised to rgb(${PAPER.join(', ')}).`);
