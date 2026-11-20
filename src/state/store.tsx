import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { StoreContext, type Store } from './storeContext';
import type { Repository } from '../data/repository';
import { setWeightUnit } from '../ui/format';
import { SEED_EXERCISES, SEED_PLANS, seedUpdates } from '../domain/seed';
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

const upsert = <T extends { id: string }>(list: T[], item: T) =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];

/** `data` with `updates` replacing the exercises of the same id, or added when new. */
function withUpdates(data: AppData, updates: Exercise[]): AppData {
  if (updates.length === 0) return data;
  const ids = new Set(updates.map((e) => e.id));
  return { ...data, exercises: [...data.exercises.filter((e) => !ids.has(e.id)), ...updates] };
}

const SAVE_ERROR =
  'Nie udało się zapisać ostatniej zmiany na urządzeniu. Sprawdź, czy w pamięci telefonu jest wolne miejsce, i zrób kopię zapasową.';

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
      // Data from an older version of the app gets the current built-in exercises.
      const updates = seedUpdates(data.exercises);
      if (updates.length > 0) {
        await Promise.all(updates.map((e) => repository.putExercise(e)));
        data = withUpdates(data, updates);
      }
      if (!cancelled) setState({ status: 'ready', data });
      // Everything lives only in this browser. Without this the browser may clear it when the device runs low on
      // space; with it the data stays until the person removes it. Granted silently or refused, never asked twice.
      void navigator.storage?.persist?.().catch(() => undefined);
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
      addImported: (exercises: Exercise[], workouts: Workout[]) =>
        commit(
          (d) => ({ ...d, exercises: [...d.exercises, ...exercises], workouts: [...d.workouts, ...workouts] }),
          async () => {
            await Promise.all(exercises.map((e) => repository.putExercise(e)));
            await Promise.all(workouts.map((w) => repository.putWorkout(w)));
          },
        ),
      replaceAll: async (imported: AppData) => {
        // A backup made by an older version lacks newer built-in exercises; restore it with them.
        const data = withUpdates(imported, seedUpdates(imported.exercises));
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

export { useStore, type Store } from './storeContext';
