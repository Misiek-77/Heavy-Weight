import { useState } from 'react';
import { Link } from 'react-router-dom';
import { finishedWorkouts, workoutVolume } from '../domain/stats';
import type { Plan, Workout } from '../domain/types';
import { createWorkout } from '../domain/workout';
import { useStore } from '../state/store';
import { Header } from '../ui/Chrome';
import { formatDay, formatDuration, formatLongDay, formatWhole, plural } from '../ui/format';
import { Icon } from '../ui/Icon';
import { Sheet } from '../ui/Sheet';
import { ActiveWorkout } from './ActiveWorkout';

export interface WorkoutSummary {
  workout: Workout;
  /** Exercises whose estimated 1RM set a new personal record. */
  recordExerciseIds: string[];
}

export function TrainingScreen() {
  const store = useStore();
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);

  if (store.activeWorkout) return <ActiveWorkout workout={store.activeWorkout} onFinished={setSummary} />;

  const start = (plan?: Plan) =>
    store.saveWorkout(
      createWorkout({ plan, name: plan?.name ?? 'Trening', now: new Date().toISOString(), history: store.workouts }),
    );
  const last = finishedWorkouts(store.workouts)[0];

  return (
    <main className="screen">
      <Header>
        <Link className="icon-btn" to="/ustawienia" aria-label="Ustawienia">
          <Icon name="settings" />
        </Link>
      </Header>
      <h1 className="title">Trening</h1>
      <p className="subtitle">
        {formatLongDay(new Date())}
        {last && ` · ostatnio ${last.name}, ${formatDay(last.startedAt)}`}
      </p>

      <div className="section">
        <button type="button" className="btn btn-primary btn-block" onClick={() => start()}>
          <Icon name="plus" />
          Rozpocznij pusty trening
        </button>
      </div>

      <section className="section">
        <h2 className="label">Zacznij z planu</h2>
        {store.plans.length === 0 ? (
          <p className="empty">
            Nie masz jeszcze planów. Dodaj pierwszy w zakładce <Link to="/plany">Plany</Link>.
          </p>
        ) : (
          <ul className="list">
            {store.plans.map((plan) => (
              <li key={plan.id}>
                <button type="button" className="item" onClick={() => start(plan)}>
                  <span className="item-main">
                    <span className="item-title">{plan.name}</span>
                    <span className="item-sub" style={{ display: 'block' }}>
                      {plural(plan.items.length, 'ćwiczenie', 'ćwiczenia', 'ćwiczeń')}
                    </span>
                  </span>
                  <span className="item-end">
                    <Icon name="forward" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Sheet open={summary !== null} onClose={() => setSummary(null)} title="Trening zapisany">
        {summary && <Summary summary={summary} onClose={() => setSummary(null)} />}
      </Sheet>
    </main>
  );
}

function Summary({ summary, onClose }: { summary: WorkoutSummary; onClose(): void }) {
  const { exerciseName } = useStore();
  const { workout, recordExerciseIds } = summary;
  const sets = workout.entries.reduce((n, e) => n + e.sets.length, 0);
  const duration = Date.parse(workout.finishedAt ?? workout.startedAt) - Date.parse(workout.startedAt);

  return (
    <div className="stack">
      <p className="muted">{workout.name}</p>
      <div className="stats" style={{ marginTop: 0 }}>
        <div>
          <div className="stat-value">{formatDuration(duration)}</div>
          <div className="stat-label">Czas</div>
        </div>
        <div>
          <div className="stat-value">
            {formatWhole(workoutVolume(workout))} <small>kg</small>
          </div>
          <div className="stat-label">Objętość</div>
        </div>
        <div>
          <div className="stat-value">{sets}</div>
          <div className="stat-label">Serie</div>
        </div>
      </div>
      {recordExerciseIds.length > 0 && (
        <div>
          <h3 className="label" style={{ marginTop: 12 }}>
            Nowe rekordy
          </h3>
          <ul className="list">
            {recordExerciseIds.map((id) => (
              <li key={id}>
                <div className="item" style={{ minHeight: 48 }}>
                  {exerciseName(id)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button type="button" className="btn btn-primary btn-block" onClick={onClose}>
        Gotowe
      </button>
    </div>
  );
}
