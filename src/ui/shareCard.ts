/** What goes on a shareable summary card. All text already formatted for display. */
export interface CardData {
  /** "Tydzień", "Miesiąc" or "Rok". */
  kind: string;
  /** "16 lis – 22 lis 2026". */
  period: string;
  /** Illustration shown at the top; drawn only if it loads. */
  artUrl: string;
  workouts: string;
  /** Up to four figures under the headline, e.g. ["4 h 10 min", "Czas"]. */
  stats: [value: string, label: string][];
  /** Most done exercises, as "Przysiad ze sztangą · 12 serii". */
  top: string[];
}

const W = 1080;
const H = 1350;
const PAPER = '#f7f7f3';
const INK = '#121211';
const MUTED = '#6b6b63';
const ACCENT = '#c8f031';
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Shortens text with an ellipsis until it fits `max` pixels. */
function fit(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > max) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

/**
 * Draws a 1080×1350 summary card (the portrait size social apps show in full) and returns it as a JPEG.
 * Light colours whatever the app theme, so the card looks the same wherever it is posted.
 */
export async function drawSummaryCard(data: CardData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  const art = await loadImage(data.artUrl);
  const artH = 560;
  if (art) ctx.drawImage(art, 0, 0, W, (W * art.height) / art.width);
  // The illustration fades into the paper so the text below sits on a clean background.
  const fade = ctx.createLinearGradient(0, artH - 200, 0, artH);
  fade.addColorStop(0, 'rgba(247,247,243,0)');
  fade.addColorStop(1, PAPER);
  ctx.fillStyle = fade;
  ctx.fillRect(0, artH - 200, W, 200);
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, artH, W, H - artH);

  const x = 72;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = MUTED;
  ctx.font = `600 34px ${FONT}`;
  ctx.fillText(`${data.kind.toUpperCase()} · ${data.period}`, x, artH + 10);

  ctx.fillStyle = INK;
  ctx.font = `800 150px ${FONT}`;
  const big = data.workouts.split(' ')[0];
  ctx.fillText(big, x, artH + 160);
  const bigWidth = ctx.measureText(big).width;
  ctx.font = `650 52px ${FONT}`;
  ctx.fillText(data.workouts.slice(big.length).trim(), x + bigWidth + 24, artH + 160);

  // Figures in two columns.
  const top = artH + 240;
  data.stats.slice(0, 4).forEach(([value, label], i) => {
    const cx = x + (i % 2) * 470;
    const cy = top + Math.floor(i / 2) * 140;
    ctx.fillStyle = ACCENT;
    ctx.fillRect(cx, cy - 8, 8, 108);
    ctx.fillStyle = INK;
    ctx.font = `750 58px ${FONT}`;
    ctx.fillText(fit(ctx, value, 420), cx + 28, cy + 50);
    ctx.fillStyle = MUTED;
    ctx.font = `500 30px ${FONT}`;
    ctx.fillText(label, cx + 28, cy + 92);
  });

  if (data.top.length > 0) {
    const ty = top + 330;
    ctx.fillStyle = MUTED;
    ctx.font = `600 30px ${FONT}`;
    ctx.fillText('NAJCZĘŚCIEJ', x, ty);
    ctx.fillStyle = INK;
    ctx.font = `550 36px ${FONT}`;
    data.top.slice(0, 3).forEach((line, i) => ctx.fillText(fit(ctx, `${i + 1}. ${line}`, W - 2 * x), x, ty + 56 + i * 52));
  }

  ctx.fillStyle = MUTED;
  ctx.font = `600 28px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText('Trening', W - x, H - 48);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), 'image/jpeg', 0.9));
}
