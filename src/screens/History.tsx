import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { finishedWorkouts, workoutVolume } from '../domain/stats';
import type { Workout } from '../domain/types';
import { repeatWorkout } from '../domain/workout';
import { useStore } from '../state/store';
import { Header } from '../ui/Chrome';
import { ExerciseThumb } from '../ui/ExerciseThumb';
import { SET_KIND_INFO } from '../ui/setKinds';
import { formatDay, formatDuration, formatEntrySet, formatRange, formatVolume, plural, weightStep, weightUnit } from '../ui/format';
import { Icon } from '../ui/Icon';
import { Confirm } from '../ui/Sheet';

const durationOf = (w: Workout) => Date.parse(w.finishedAt ?? w.startedAt) - Date.parse(w.startedAt);
const setCount = (w: Workout) => w.entries.reduce((n, e) => n + e.sets.length, 0);

const monthFormat = new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' });

/** Workouts (newest first) split into calendar months: "listopad 2026". */
function byMonth(workouts: Workout[]): { label: string; workouts: Workout[] }[] {
  const groups: { label: string; workouts: Workout[] }[] = [];
  for (const w of workouts) {
    const label = monthFormat.format(new Date(w.startedAt));
    if (groups.at(-1)?.label === label) groups.at(-1)!.workouts.push(w);
    else groups.push({ label, workouts: [w] });
  }
  return groups;
}

export function HistoryScreen() {
  const { workouts, timedIds } = useStore();
  const finished = finishedWorkouts(workouts);
  return (
    <main className="screen">
      <Header />
      <h1 className="title">Historia</h1>
      <p className="subtitle">
        {finished.length === 0
          ? 'Tu pojawią się zakończone treningi.'
          : plural(finished.length, 'zapisany trening', 'zapisane treningi', 'zapisanych treningów')}
      </p>

      <div className="section">
        {finished.length === 0 ? (
          <p className="empty">Zakończ pierwszy trening, żeby zobaczyć go w historii.</p>
        ) : (
          byMonth(finished).map((group) => (
          <section key={group.label} className="history-month">
          <h2 className="label">
            {group.label} · {plural(group.workouts.length, 'trening', 'treningi', 'treningów')}
          </h2>
          <ul className="list">
            {group.workouts.map((w) => (
              <li key={w.id}>
                <Link className="item" to={`/historia/${w.id}`}>
                  <span className="item-main">
                    <span className="item-title">{w.name}</span>
                    <span className="item-sub">
                      {formatDay(w.startedAt)} · {formatDuration(durationOf(w))} · {formatVolume(workoutVolume(w, timedIds))} {weightUnit()}
                    </span>
                  </span>
                  <span className="item-end">
                    <Icon name="forward" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          </section>
          ))
        )}
      </div>
    </main>
  );
}

export function WorkoutDetail() {
  const { id } = useParams();
  const store = useStore();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const workout = store.workouts.find((w) => w.id === id && w.finishedAt);
  if (!workout) return <Navigate to="/historia" replace />;

  return (
    <main className="screen">
      <Header back="/historia">
        <button type="button" className="icon-btn" aria-label="Usuń trening" onClick={() => setConfirming(true)}>
          <Icon name="trash" />
        </button>
      </Header>
      <h1 className="title">{workout.name}</h1>
      <p className="subtitle">{formatDay(workout.startedAt)}</p>

      <div className="stats">
        <div>
          <div className="stat-value">{formatDuration(durationOf(workout))}</div>
          <div className="stat-label">Czas</div>
        </div>
        <div>
          <div className="stat-value">
            {formatVolume(workoutVolume(workout, store.timedIds))} <small>{weightUnit()}</small>
          </div>
          <div className="stat-label">Objętość</div>
        </div>
        <div>
          <div className="stat-value">{setCount(workout)}</div>
          <div className="stat-label">Serie</div>
        </div>
      </div>

      {workout.note && <p className="note-text">{workout.note}</p>}

      {workout.entries.map((entry, i) => (
        <section className="section" key={i}>
          <h2 className="item-title">
            <Link className="thumb-link" to={`/cwiczenia/${entry.exerciseId}`}>
              <ExerciseThumb exerciseId={entry.exerciseId} />
              {store.exerciseName(entry.exerciseId)}
            </Link>
          </h2>
          {(entry.repMax || entry.linkNext) && (
            <p className="entry-target">
              {[
                formatRange(entry.repMin, entry.repMax, store.timedIds.has(entry.exerciseId)) && `Cel: ${formatRange(entry.repMin, entry.repMax, store.timedIds.has(entry.exerciseId))}`,
                entry.linkNext && 'superset z następnym',
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
          <dl className="set-list">
            {entry.sets.map((set, n) => (
              <div key={n} style={{ display: 'contents' }}>
                <dt>{n + 1}</dt>
                <dd>
                  {formatEntrySet(set, store.timedIds.has(entry.exerciseId))}
                  {set.kind && set.kind !== 'normal' && <span className="kind-tag">{SET_KIND_INFO[set.kind].label}</span>}
                </dd>
              </div>
            ))}
          </dl>
          {entry.note && <p className="note-text">{entry.note}</p>}
        </section>
      ))}

      <div className="section">
        {store.activeWorkout ? (
          <Link className="btn btn-block" to="/">
            Masz trening w toku — wróć do niego
          </Link>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => {
              store.saveWorkout(repeatWorkout(workout, store.workouts, new Date().toISOString(), weightStep()));
              navigate('/');
            }}
          >
            Powtórz ten trening
          </button>
        )}
      </div>

      <Confirm
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          store.removeWorkout(workout.id);
          navigate('/historia');
        }}
        title="Usunąć trening?"
        message="Trening zniknie z historii i przestanie liczyć się do rekordów. Tej operacji nie można cofnąć."
        confirmLabel="Usuń trening"
      />
    </main>
  );
}
