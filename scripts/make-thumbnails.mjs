/**
 * Writes the small images shown next to exercise names in lists.
 *
 *   node scripts/make-thumbnails.mjs            every illustration
 *   node scripts/make-thumbnails.mjs squat      just these
 *
 * Reads public/exercises/<id>.jpg and writes public/exercises/thumbs/<id>.jpg, sized for the largest
 * thumbnail (104 CSS pixels) on a 3x screen, so a list of exercises does not download full illustrations.
 * The importers run it on their own; run it by hand only after changing an illustration some other way.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Jimp } from 'jimp';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'exercises');
const OUT = join(DIR, 'thumbs');
/** Same 960:717 shape as the illustrations. */
export const THUMB = { w: 320, h: 239 };

const only = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const files = readdirSync(DIR).filter((f) => f.endsWith('.jpg') && (only.length === 0 || only.includes(f.slice(0, -4))));
for (const file of files) {
  const image = await Jimp.fromBuffer(readFileSync(join(DIR, file)));
  image.resize({ w: THUMB.w, h: THUMB.h });
  writeFileSync(join(OUT, file), await image.getBuffer('image/jpeg', { quality: 82 }));
}
console.log(`Thumbnails: ${files.length} written to public/exercises/thumbs.`);
