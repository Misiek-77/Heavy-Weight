import { useState } from 'react';
import { Link } from 'react-router-dom';
import { finishedWorkouts, workoutVolume } from '../domain/stats';
import type { Plan, Workout } from '../domain/types';
import { backupDue, snoozeUntil } from '../domain/backupReminder';
import { planForDay } from '../domain/wizard';
import { createWorkout } from '../domain/workout';
import { useStore } from '../state/store';
import { Header } from '../ui/Chrome';
import { formatDay, formatDuration, formatLongDay, formatVolume, plural, weightStep, weightUnit } from '../ui/format';
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
      createWorkout({ plan, name: plan?.name ?? 'Trening', now: new Date().toISOString(), history: store.workouts, step: weightStep() }),
    );
  const last = finishedWorkouts(store.workouts)[0];
  const today = planForDay(store.settings.schedule, store.plans, new Date());
  const finishedCount = store.workouts.filter((w) => w.finishedAt).length;
  const remind = backupDue(store.settings, finishedCount, new Date());
  const scheduled = store.settings.schedule.some((id) => store.plans.some((p) => p.id === id));

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

      {remind && (
        <section className="section reminder" role="note">
          <p>
            <strong>Zrób kopię zapasową.</strong> Masz {plural(finishedCount, 'trening', 'treningi', 'treningów')} zapisanych tylko na
            tym urządzeniu{store.settings.lastBackupAt ? `, a ostatnia kopia jest z dnia ${formatDay(store.settings.lastBackupAt)}` : ''}.
          </p>
          <div className="reminder-actions">
            <Link className="btn btn-small btn-primary" to="/ustawienia">
              Przejdź do kopii
            </Link>
            <button
              type="button"
              className="btn btn-small btn-quiet"
              onClick={() => store.saveSettings({ ...store.settings, backupSnoozedUntil: snoozeUntil(new Date()) })}
            >
              Później
            </button>
          </div>
        </section>
      )}

      {today ? (
        <section className="section today">
          <h2 className="label">Dziś</h2>
          <p className="today-plan">{today.name}</p>
          <p className="muted small">
            {plural(today.items.length, 'ćwiczenie', 'ćwiczenia', 'ćwiczeń')} ·{' '}
            {plural(
              today.items.reduce((n, i) => n + i.targetSets, 0),
              'seria',
              'serie',
              'serii',
            )}
          </p>
          <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={() => start(today)}>
            Rozpocznij: {today.name}
          </button>
        </section>
      ) : (
        scheduled && (
          <section className="section today">
            <h2 className="label">Dziś</h2>
            <p className="today-plan">Odpoczynek</p>
            <p className="muted small">Według harmonogramu dziś nie ma treningu. Możesz mimo to zacząć dowolny.</p>
          </section>
        )
      )}

      <div className="section">
        <button type="button" className={today ? 'btn btn-block' : 'btn btn-primary btn-block'} onClick={() => start()}>
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
                    <span className="item-sub">
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
  const { exerciseName, timedIds } = useStore();
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
            {formatVolume(workoutVolume(workout, timedIds))} <small>{weightUnit()}</small>
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
