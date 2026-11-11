// Generates the app icons (a dumbbell on a dark square) without any image dependency.
import { deflateSync, crc32 } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const BG = [14, 14, 14];
const FG = [200, 240, 49];
const RECTS = [
  [0.2, 0.47, 0.8, 0.53],
  [0.27, 0.3, 0.35, 0.7],
  [0.65, 0.3, 0.73, 0.7],
  [0.17, 0.38, 0.24, 0.62],
  [0.76, 0.38, 0.83, 0.62],
];

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), body.length + 4);
  return out;
}

function png(size) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (size * 3 + 1);
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size;
      const v = (y + 0.5) / size;
      const on = RECTS.some(([x0, y0, x1, y1]) => u >= x0 && u < x1 && v >= y0 && v < y1);
      raw.set(on ? FG : BG, row + 1 + x * 3);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) writeFileSync(`public/icon-${size}.png`, png(size));
