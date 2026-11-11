import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Repository } from '../data/repository';
import { SEED_EXERCISES, SEED_PLANS } from '../domain/seed';
import { DEFAULT_SETTINGS, type AppData, type Exercise, type Plan, type Settings, type Workout } from '../domain/types';

export interface Store extends AppData {
  /** The workout in progress, if any. */
  activeWorkout: Workout | undefined;
  /** Message of the last failed save, shown as a banner. */
  error: string | null;
  dismissError(): void;
  exerciseName(id: string): string;
  saveExercise(exercise: Exercise): void;
  savePlan(plan: Plan): void;
  removePlan(id: string): void;
  saveWorkout(workout: Workout): void;
  removeWorkout(id: string): void;
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
        data = { exercises: SEED_EXERCISES, plans: SEED_PLANS, workouts: [], settings: DEFAULT_SETTINGS };
        await repository.replaceAll(data);
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
    const names = new Map(data.exercises.map((e) => [e.id, e.name]));
    return {
      ...data,
      ...actions,
      error,
      activeWorkout: data.workouts.find((w) => !w.finishedAt),
      exerciseName: (id) => names.get(id) ?? 'Usunięte ćwiczenie',
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
