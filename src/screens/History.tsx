import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { finishedWorkouts, workoutVolume } from '../domain/stats';
import type { Workout } from '../domain/types';
import { useStore } from '../state/store';
import { Header } from '../ui/Chrome';
import { formatDay, formatDuration, formatSet, formatWhole, plural } from '../ui/format';
import { Icon } from '../ui/Icon';
import { Confirm } from '../ui/Sheet';

const durationOf = (w: Workout) => Date.parse(w.finishedAt ?? w.startedAt) - Date.parse(w.startedAt);
const setCount = (w: Workout) => w.entries.reduce((n, e) => n + e.sets.length, 0);

export function HistoryScreen() {
  const { workouts } = useStore();
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
          <ul className="list">
            {finished.map((w) => (
              <li key={w.id}>
                <Link className="item" to={`/historia/${w.id}`}>
                  <span className="item-main">
                    <span className="item-title">{w.name}</span>
                    <span className="item-sub" style={{ display: 'block' }}>
                      {formatDay(w.startedAt)} · {formatDuration(durationOf(w))} · {formatWhole(workoutVolume(w))} kg
                    </span>
                  </span>
                  <span className="item-end">
                    <Icon name="forward" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
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
            {formatWhole(workoutVolume(workout))} <small>kg</small>
          </div>
          <div className="stat-label">Objętość</div>
        </div>
        <div>
          <div className="stat-value">{setCount(workout)}</div>
          <div className="stat-label">Serie</div>
        </div>
      </div>

      {workout.entries.map((entry, i) => (
        <section className="section" key={i}>
          <h2 className="item-title">
            <Link to={`/cwiczenia/${entry.exerciseId}`}>{store.exerciseName(entry.exerciseId)}</Link>
          </h2>
          <dl className="set-list">
            {entry.sets.map((set, n) => (
              <div key={n} style={{ display: 'contents' }}>
                <dt>{n + 1}</dt>
                <dd>{formatSet(set.weight, set.reps)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

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
