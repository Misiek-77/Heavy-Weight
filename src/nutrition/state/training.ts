import { useMemo } from 'react';
import { dayKey } from '../../shared/date';
import { useStore } from '../../state/store';
import type { WeightPoint } from '../domain/weight';

/** What the diet takes from the training part of the app: workout days and body weight readings. */
export interface TrainingLink {
  /** Days with a workout, "2026-11-21". */
  workoutDays: Set<string>;
  weights: WeightPoint[];
}

/** Live from the training store, so a workout started a moment ago already counts. */
export function useTrainingLink(): TrainingLink {
  const { workouts, measurements } = useStore();
  return useMemo(() => {
    const workoutDays = new Set(workouts.map((w) => dayKey(new Date(w.startedAt))));
    const weights: WeightPoint[] = measurements
      .filter((m) => m.values.weight !== undefined && m.values.weight > 0)
      .map((m) => ({ date: m.date, kg: m.values.weight!, updatedAt: m.updatedAt }));
    return { workoutDays, weights };
  }, [workouts, measurements]);
}
