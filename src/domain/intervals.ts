/** A timed interval workout: rounds of work and rest after a short count-in. */
export interface IntervalPlan {
  workSeconds: number;
  /** 0 for EMOM, where the rest is whatever is left of each minute. */
  restSeconds: number;
  rounds: number;
}

export const INTERVAL_MODES = ['emom', 'tabata', 'custom'] as const;
export type IntervalMode = (typeof INTERVAL_MODES)[number];

export const INTERVAL_PRESETS: Record<Exclude<IntervalMode, 'custom'>, IntervalPlan> = {
  emom: { workSeconds: 60, restSeconds: 0, rounds: 10 },
  tabata: { workSeconds: 20, restSeconds: 10, rounds: 8 },
};

/** Seconds of count-in before the first round, to get into position. */
export const PREP_SECONDS = 10;

export type PhaseKind = 'prep' | 'work' | 'rest' | 'done';

export interface Phase {
  kind: PhaseKind;
  /** 1-based round; 0 during the count-in. */
  round: number;
  /** Seconds left in this phase, rounded up. */
  remaining: number;
  length: number;
}

/** Length of the whole workout with its count-in; the last round has no rest after it. */
export const totalSeconds = (p: IntervalPlan) => PREP_SECONDS + p.rounds * (p.workSeconds + p.restSeconds) - p.restSeconds;

/** Where the workout is `elapsed` seconds after the start. */
export function phaseAt(p: IntervalPlan, elapsed: number): Phase {
  const left = (length: number, into: number) => Math.max(0, Math.ceil(length - into));
  if (elapsed < PREP_SECONDS) return { kind: 'prep', round: 0, remaining: left(PREP_SECONDS, elapsed), length: PREP_SECONDS };
  if (elapsed >= totalSeconds(p)) return { kind: 'done', round: p.rounds, remaining: 0, length: 0 };
  const t = elapsed - PREP_SECONDS;
  const cycle = p.workSeconds + p.restSeconds;
  const round = Math.floor(t / cycle) + 1;
  const into = t - (round - 1) * cycle;
  return into < p.workSeconds
    ? { kind: 'work', round, remaining: left(p.workSeconds, into), length: p.workSeconds }
    : { kind: 'rest', round, remaining: left(p.restSeconds, into - p.workSeconds), length: p.restSeconds };
}
