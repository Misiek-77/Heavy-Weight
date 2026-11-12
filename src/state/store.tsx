import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Repository } from '../data/repository';
import { setWeightUnit } from '../ui/format';
import { SEED_EXERCISES, SEED_PLANS, TIMED_SEEDS } from '../domain/seed';
import {
  DEFAULT_SETTINGS,
  type AppData,
  type Exercise,
  type Goal,
  type Measurement,
  type Photo,
  type Plan,
  type Settings,
  type Workout,
} from '../domain/types';

export interface Store extends AppData {
  /** The workout in progress, if any. */
  activeWorkout: Workout | undefined;
  /** Message of the last failed save, shown as a banner. */
  error: string | null;
  dismissError(): void;
  exerciseName(id: string): string;
  /** Ids of exercises held for time, whose sets count seconds. */
  timedIds: ReadonlySet<string>;
  saveExercise(exercise: Exercise): void;
  savePlan(plan: Plan): void;
  removePlan(id: string): void;
  saveWorkout(workout: Workout): void;
  removeWorkout(id: string): void;
  saveMeasurement(measurement: Measurement): void;
  removeMeasurement(id: string): void;
  saveGoal(goal: Goal): void;
  removeGoal(id: string): void;
  /** Physique photos, read and written straight from storage rather than held in memory. */
  photos: { list(): Promise<Photo[]>; save(photo: Photo): Promise<void>; remove(id: string): Promise<void> };
  saveSettings(settings: Settings): void;
  replaceAll(data: AppData): Promise<void>;
}

const StoreContext = createContext<Store | null>(null);

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside <StoreProvider>');
  return store;
}

const upsert = <T extends { id: string }>(list: T[], item: T) =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];

const SAVE_ERROR = 'Nie udało się zapisać danych na urządzeniu. Zmiana zostanie zapisana przy następnej edycji.';

type LoadState = { status: 'loading' } | { status: 'failed' } | { status: 'ready'; data: AppData };

export function StoreProvider({ repository, children }: { repository: Repository; children: ReactNode }) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let data = await repository.loadAll();
      if (data.exercises.length === 0) {
        // First run: exercises are never deleted (only archived), so an empty list means a fresh install.
        data = { exercises: SEED_EXERCISES, plans: SEED_PLANS, workouts: [], measurements: [], goals: [], settings: DEFAULT_SETTINGS };
        await repository.replaceAll(data);
      }
      // Installs from before timed exercises existed: mark the built-in ones that are held for time.
      const untimed = data.exercises.filter((e) => TIMED_SEEDS.has(e.id) && e.timed === undefined);
      if (untimed.length > 0) {
        const fixed = untimed.map((e) => ({ ...e, timed: true }));
        await Promise.all(fixed.map((e) => repository.putExercise(e)));
        data = { ...data, exercises: data.exercises.map((e) => fixed.find((x) => x.id === e.id) ?? e) };
      }
      if (!cancelled) setState({ status: 'ready', data });
    })().catch(() => {
      if (!cancelled) setState({ status: 'failed' });
    });
    return () => {
      cancelled = true;
    };
  }, [repository]);

  /** Applies a change in memory right away and persists it in the background. */
  const commit = useCallback((change: (data: AppData) => AppData, persist: () => Promise<void>) => {
    setState((s) => (s.status === 'ready' ? { status: 'ready', data: change(s.data) } : s));
    persist().then(
      () => setError(null),
      () => setError(SAVE_ERROR),
    );
  }, []);

  const actions = useMemo(
    () => ({
      dismissError: () => setError(null),
      saveExercise: (e: Exercise) =>
        commit((d) => ({ ...d, exercises: upsert(d.exercises, e) }), () => repository.putExercise(e)),
      savePlan: (p: Plan) => commit((d) => ({ ...d, plans: upsert(d.plans, p) }), () => repository.putPlan(p)),
      removePlan: (id: string) =>
        commit((d) => ({ ...d, plans: d.plans.filter((p) => p.id !== id) }), () => repository.deletePlan(id)),
      saveWorkout: (w: Workout) =>
        commit((d) => ({ ...d, workouts: upsert(d.workouts, w) }), () => repository.putWorkout(w)),
      removeWorkout: (id: string) =>
        commit((d) => ({ ...d, workouts: d.workouts.filter((w) => w.id !== id) }), () => repository.deleteWorkout(id)),
      saveMeasurement: (m: Measurement) =>
        commit((d) => ({ ...d, measurements: upsert(d.measurements, m) }), () => repository.putMeasurement(m)),
      removeMeasurement: (id: string) =>
        commit(
          (d) => ({ ...d, measurements: d.measurements.filter((m) => m.id !== id) }),
          () => repository.deleteMeasurement(id),
        ),
      saveGoal: (g: Goal) => commit((d) => ({ ...d, goals: upsert(d.goals, g) }), () => repository.putGoal(g)),
      removeGoal: (id: string) =>
        commit((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id) }), () => repository.deleteGoal(id)),
      photos: {
        list: () => repository.listPhotos(),
        save: (p: Photo) => repository.putPhoto(p),
        remove: (id: string) => repository.deletePhoto(id),
      },
      saveSettings: (s: Settings) => commit((d) => ({ ...d, settings: s }), () => repository.putSettings(s)),
      replaceAll: async (data: AppData) => {
        await repository.replaceAll(data);
        setState({ status: 'ready', data });
      },
    }),
    [commit, repository],
  );

  const data = state.status === 'ready' ? state.data : null;
  const store = useMemo<Store | null>(() => {
    if (!data) return null;
    // Set before any screen renders with these settings, so every formatted weight uses the chosen unit.
    setWeightUnit(data.settings.unit);
    const names = new Map(data.exercises.map((e) => [e.id, e.name]));
    return {
      ...data,
      plans: [...data.plans].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      ...actions,
      error,
      activeWorkout: data.workouts.find((w) => !w.finishedAt),
      exerciseName: (id) => names.get(id) ?? 'Usunięte ćwiczenie',
      timedIds: new Set(data.exercises.filter((e) => e.timed).map((e) => e.id)),
    };
  }, [data, actions, error]);

  if (state.status === 'failed') {
    return (
      <div className="app">
        <main className="screen">
          <h1 className="title">Nie udało się wczytać danych</h1>
          <p className="subtitle">
            Przeglądarka nie pozwoliła otworzyć lokalnej bazy danych. Sprawdź, czy nie korzystasz z trybu prywatnego, i
            odśwież stronę.
          </p>
        </main>
      </div>
    );
  }
  if (!store) return null;
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}
