/**
 * Turns animation sprite sheets into what the app shows for an exercise.
 *
 *   node scripts/import-frames.mjs <folder> [exercise-id ...]
 *
 * Reads <folder>/trening-frames-<exercise-id>.jpg: one image holding four consecutive moments of a
 * repetition in a 2 by 2 grid (top-left, top-right, bottom-left, bottom-right). For each one it writes
 *
 *   public/exercises/frames/<id>.jpg   the four frames in a row, same crop for each, for the animation
 *   public/exercises/<id>.jpg          first and last frame side by side, for thumbnails and "both poses"
 *
 * and then rebuilds the manifest. All output shares one paper colour so the set looks uniform.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Jimp } from 'jimp';
import { POSES } from './illustration-poses.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'exercises');
const FRAMES_DIR = join(OUT_DIR, 'frames');
/** Must match the background the app draws behind illustrations. */
const PAPER = [247, 247, 243];
const PAPER_HEX = 0xf7f7f3ff;
/** Side of one square animation frame, and the size of the two-pose image. */
const FRAME = 440;
const STILL = { w: 960, h: 717 };
/** Share of each grid cell ignored at its edges, where the generator sometimes draws dividing lines. */
const CELL_INSET = 0.03;
/** Empty space kept around the drawing, as a share of its larger side. */
const MARGIN = 0.06;

/** Ids given to an option like `--top-row=a,b`. */
const listOption = (name) =>
  new Set((process.argv.find((a) => a.startsWith(`--${name}=`)) ?? '').slice(name.length + 3).split(',').filter(Boolean));
/** `--top-row=a,b` reads those sheets as a 4 by 2 grid and uses only its top row. */
const TOP_ROW = listOption('top-row');
/** `--one-row=a,b` reads those sheets as four frames in a single row. */
const ONE_ROW = listOption('one-row');
const [folder, ...only] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!folder) throw new Error('Usage: node scripts/import-frames.mjs <folder> [exercise-id ...]');

const median = (values) => values.sort((a, b) => a - b)[Math.floor(values.length / 2)];

/** White-balances the image so its own background becomes PAPER, then flattens what is left of the texture. */
function toPaper(image) {
  const { data, width, height } = image.bitmap;
  const frame = Math.max(2, Math.round(Math.min(width, height) * 0.02));
  const channels = [[], [], []];
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      if (x >= frame && x < width - frame && y >= frame && y < height - frame) continue;
      const i = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) channels[c].push(data[i + c]);
    }
  }
  const gain = channels.map((values, c) => PAPER[c] / Math.max(1, median(values)));
  for (let i = 0; i < data.length; i += 4) {
    let distance = 0;
    for (let c = 0; c < 3; c++) {
      const value = Math.min(255, Math.round(data[i + c] * gain[c]));
      data[i + c] = value;
      distance = Math.max(distance, Math.abs(value - PAPER[c]));
    }
    if (distance <= 14) for (let c = 0; c < 3; c++) data[i + c] = PAPER[c];
  }
}

/** Bounding box of everything in the region that is not paper, relative to the region; null when it is empty. */
function contentBox({ data, width }, region) {
  let left = Infinity, top = Infinity, right = -1, bottom = -1;
  for (let y = 0; y < region.h; y++) {
    for (let x = 0; x < region.w; x++) {
      const i = ((region.y + y) * width + region.x + x) * 4;
      if (data[i] === PAPER[0] && data[i + 1] === PAPER[1] && data[i + 2] === PAPER[2]) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }
  return right < 0 ? null : { left, top, right, bottom };
}

async function importOne(key) {
  const sheet = await Jimp.fromBuffer(readFileSync(join(folder, `trening-frames-${key}.jpg`)));
  toPaper(sheet);
  const { width, height } = sheet.bitmap;
  // Usually a 2 by 2 grid. Some sheets came back as 4 by 2, where the top row alone is the whole movement,
  // and some were made as a single row of four.
  const cols = TOP_ROW.has(key) || ONE_ROW.has(key) ? 4 : 2;
  const rows = ONE_ROW.has(key) ? 1 : 2;
  const cw = Math.floor(width / cols);
  const ch = Math.floor(height / rows);
  const inset = { x: Math.round(cw * CELL_INSET), y: Math.round(ch * CELL_INSET) };
  // Reading order: left to right, top to bottom.
  const cells = [0, 1, 2, 3].map((n) => ({
    x: (n % cols) * cw + inset.x,
    y: Math.floor(n / cols) * ch + inset.y,
    w: cw - inset.x * 2,
    h: ch - inset.y * 2,
  }));

  // One crop for all four frames, so whatever stays still in the drawing stays still in the animation.
  const boxes = cells.map((cell) => contentBox(sheet.bitmap, cell)).filter(Boolean);
  if (boxes.length < 4) throw new Error('a panel of the sheet is empty');
  const box = {
    left: Math.min(...boxes.map((b) => b.left)),
    top: Math.min(...boxes.map((b) => b.top)),
    right: Math.max(...boxes.map((b) => b.right)),
    bottom: Math.max(...boxes.map((b) => b.bottom)),
  };
  const bw = box.right - box.left + 1;
  const bh = box.bottom - box.top + 1;
  const scale = (FRAME * (1 - MARGIN * 2)) / Math.max(bw, bh);
  const fw = Math.round(bw * scale);
  const fh = Math.round(bh * scale);

  const frames = cells.map((cell) =>
    sheet.clone().crop({ x: cell.x + box.left, y: cell.y + box.top, w: bw, h: bh }).resize({ w: fw, h: fh }),
  );
  const strip = new Jimp({ width: FRAME * 4, height: FRAME, color: PAPER_HEX });
  frames.forEach((frame, n) => strip.composite(frame, n * FRAME + Math.round((FRAME - fw) / 2), Math.round((FRAME - fh) / 2)));
  writeFileSync(join(FRAMES_DIR, `${key}.jpg`), await strip.getBuffer('image/jpeg', { quality: 84 }));

  // First and last frame side by side, each as large as half of the still image allows.
  const half = STILL.w / 2;
  const fit = Math.min((half * (1 - MARGIN)) / bw, (STILL.h * (1 - MARGIN * 2)) / bh);
  const sw = Math.round(bw * fit);
  const sh = Math.round(bh * fit);
  const still = new Jimp({ width: STILL.w, height: STILL.h, color: PAPER_HEX });
  [0, 3].forEach((n, side) => {
    const cell = cells[n];
    const pose = sheet.clone().crop({ x: cell.x + box.left, y: cell.y + box.top, w: bw, h: bh }).resize({ w: sw, h: sh });
    still.composite(pose, side * half + Math.round((half - sw) / 2), Math.round((STILL.h - sh) / 2));
  });
  writeFileSync(join(OUT_DIR, `${key}.jpg`), await still.getBuffer('image/jpeg', { quality: 84 }));

  // How much the drawing moves between frames says whether the panels really line up.
  const drift = Math.max(...boxes.map((b) => Math.abs(b.bottom - boxes[0].bottom)));
  return { drift: Math.round((drift / ch) * 100), fill: Math.round(((bw * bh) / (cells[0].w * cells[0].h)) * 100) };
}

mkdirSync(FRAMES_DIR, { recursive: true });
const keys = (only.length ? only : readdirSync(folder).map((f) => /^trening-frames-(.+)\.jpg$/.exec(f)?.[1])).filter(
  (k) => k && k in POSES && existsSync(join(folder, `trening-frames-${k}.jpg`)),
);
for (const key of keys) {
  try {
    const { drift, fill } = await importOne(key);
    console.log(`${key}: drawing fills ${fill}% of a panel, ground line moves ${drift}% between frames`);
  } catch (error) {
    console.log(`${key}: SKIPPED, ${error.message}`);
  }
}
execFileSync(process.execPath, [join(ROOT, 'scripts', 'make-thumbnails.mjs'), ...keys], { stdio: 'inherit' });
execFileSync(process.execPath, [join(ROOT, 'scripts', 'generate-illustrations.mjs'), '--manifest'], { stdio: 'inherit' });
