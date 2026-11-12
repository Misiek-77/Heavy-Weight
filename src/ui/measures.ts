import type { Measure } from '../domain/types';

/** Names and units of the body measurements. */
export const MEASURE_INFO: Record<Measure, { label: string; unit: string }> = {
  weight: { label: 'Waga', unit: 'kg' },
  waist: { label: 'Talia', unit: 'cm' },
  chest: { label: 'Klatka', unit: 'cm' },
  arm: { label: 'Ramię', unit: 'cm' },
  thigh: { label: 'Udo', unit: 'cm' },
  hips: { label: 'Biodra', unit: 'cm' },
};
