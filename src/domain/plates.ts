/** Plates found in most gyms, in kg, heaviest first. */
export const STANDARD_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25] as const;
export const BAR_WEIGHTS = [20, 15, 10] as const;

export interface PlateLoad {
  /** Plates for one side of the bar, heaviest first. */
  perSide: number[];
  /** Total actually on the bar, including the bar. */
  loaded: number;
  /** What the available plates cannot make up (0 when the target is reachable exactly). */
  missing: number;
}

/** Fewest plates per side that get as close to `target` as possible without going over. */
export function plateLoad(target: number, bar: number, plates: readonly number[] = STANDARD_PLATES): PlateLoad {
  // Work in grams so 1.25 kg plates add up exactly.
  let left = Math.round(((target - bar) / 2) * 1000);
  const perSide: number[] = [];
  if (left > 0) {
    for (const plate of [...plates].sort((a, b) => b - a)) {
      const grams = Math.round(plate * 1000);
      while (left >= grams) {
        perSide.push(plate);
        left -= grams;
      }
    }
  }
  const loaded = bar + perSide.reduce((sum, p) => sum + p, 0) * 2;
  return { perSide, loaded, missing: Math.max(0, Math.round((target - loaded) * 1000) / 1000) };
}
