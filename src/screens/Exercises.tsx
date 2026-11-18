import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { exerciseRecords, finishedWorkouts, progressSeries } from '../domain/stats';
import { useStore } from '../state/store';
import { Header } from '../ui/Chrome';
import { ExerciseBrowser, ExerciseForm } from '../ui/ExerciseBrowser';
import { ExerciseGuide } from '../ui/ExerciseGuide';
import { capitalize, formatClock, formatDay, formatEntrySet, formatVolume, formatWeight, toUnit, weightUnit } from '../ui/format';
import { Icon } from '../ui/Icon';
import { LineChart } from '../ui/LineChart';
import { Confirm } from '../ui/Sheet';

export function ExercisesScreen() {
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  return (
    <main className="screen">
      <Header>
        <button type="button" className="icon-btn" aria-label="Dodaj własne ćwiczenie" onClick={() => setAdding(true)}>
          <Icon name="plus" />
        </button>
      </Header>
      <h1 className="title">Ćwiczenia</h1>
      <p className="subtitle">Dotknij ćwiczenia, żeby zobaczyć postępy i rekordy.</p>
      <div className="section">
        <ExerciseBrowser onSelect={(e) => navigate(`/cwiczenia/${e.id}`)} />
      </div>
      <ExerciseForm open={adding} onClose={() => setAdding(false)} />
    </main>
  );
}

const RECENT = 5;

export function ExerciseDetail() {
  const { id = '' } = useParams();
  const store = useStore();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<'edit' | 'archive' | null>(null);
  const exercise = store.exercises.find((e) => e.id === id);
  if (!exercise) return <Navigate to="/cwiczenia" replace />;

  const records = exerciseRecords(store.workouts, id);
  const timed = exercise.timed ?? false;
  const series = progressSeries(store.workouts, id, timed);
  const REST_STEP = 15;
  const rest = exercise.restSeconds ?? store.settings.restSeconds;
  const setRest = (restSeconds: number | undefined) => {
    const { restSeconds: _old, ...base } = exercise;
    store.saveExercise({ ...base, ...(restSeconds ? { restSeconds } : {}), updatedAt: new Date().toISOString() });
  };
  // A trend needs at least two workouts, and bodyweight-only history (all zeros) has nothing to plot.
  const showChart = series.length >= 2 && series.some((p) => p.value > 0);
  const recent = finishedWorkouts(store.workouts)
    .map((w) => ({ w, sets: w.entries.filter((e) => e.exerciseId === id).flatMap((e) => e.sets) }))
    .filter((x) => x.sets.length > 0)
    .slice(0, RECENT);

  return (
    <main className="screen">
      <Header back="/cwiczenia">
        {exercise.custom && !exercise.archived && (
          <>
            <button type="button" className="btn btn-small btn-quiet" onClick={() => setDialog('edit')}>
              Edytuj
            </button>
            <button type="button" className="icon-btn" aria-label="Archiwizuj ćwiczenie" onClick={() => setDialog('archive')}>
              <Icon name="trash" />
            </button>
          </>
        )}
      </Header>
      <h1 className="title">{exercise.name}</h1>
      <p className="subtitle">
        {capitalize(exercise.muscleGroup)} · {exercise.equipment}
        {exercise.archived && ' · zarchiwizowane'}
      </p>

      <ExerciseGuide exerciseId={exercise.id} name={exercise.name} />

      {!exercise.archived && (
        <section className="section">
          <h2 className="label">Przerwa po serii</h2>
          <div className="item" style={{ minHeight: 0, padding: 0 }}>
            <span className="item-main muted small">
              {exercise.restSeconds ? (
                <button type="button" className="link-btn" onClick={() => setRest(undefined)}>
                  Wróć do domyślnej ({formatClock(store.settings.restSeconds)})
                </button>
              ) : (
                'Domyślna z Ustawień. Zmień, jeśli to ćwiczenie wymaga dłuższej lub krótszej.'
              )}
            </span>
            <div className="stepper" role="group" aria-label="Przerwa po serii tego ćwiczenia">
              <button type="button" className="icon-btn" aria-label="Krótsza przerwa" disabled={rest <= REST_STEP} onClick={() => setRest(rest - REST_STEP)}>
                <Icon name="minus" />
              </button>
              <output>{formatClock(rest)}</output>
              <button type="button" className="icon-btn" aria-label="Dłuższa przerwa" disabled={rest >= 600} onClick={() => setRest(rest + REST_STEP)}>
                <Icon name="plus" />
              </button>
            </div>
          </div>
        </section>
      )}

      {recent.length === 0 ? (
        <p className="empty">Nie masz jeszcze zapisanych serii tego ćwiczenia.</p>
      ) : (
        <>
          {showChart && (
            <section className="section">
              <h2 className="label">{timed ? 'Najdłuższa seria w treningu' : 'Szacowany maks. na 1 powtórzenie'}</h2>
              <LineChart points={timed ? series : series.map((p) => ({ ...p, value: toUnit(p.value) }))} unit={timed ? 's' : weightUnit()} />
            </section>
          )}

          <section className="section">
            <h2 className="label">Rekordy</h2>
            {timed ? (
              <div className="stats" style={{ marginTop: 12 }}>
                <div>
                  <div className="stat-value">
                    {records.longest ? records.longest.reps : '—'} <small>s</small>
                  </div>
                  <div className="stat-label">Najdłuższa seria</div>
                </div>
                <span />
                <span />
              </div>
            ) : (
            <div className="stats" style={{ marginTop: 12 }}>
              <div>
                <div className="stat-value">
                  {records.maxWeight ? formatWeight(records.maxWeight.weight) : '—'} <small>{weightUnit()}</small>
                </div>
                <div className="stat-label">
                  Najcięższa seria{records.maxWeight && ` · ${records.maxWeight.reps} powt.`}
                </div>
              </div>
              <div>
                <div className="stat-value">
                  {records.best1RM ? formatWeight(Math.round(records.best1RM.value * 10) / 10) : '—'} <small>{weightUnit()}</small>
                </div>
                <div className="stat-label">Szacowane 1RM</div>
              </div>
              <div>
                <div className="stat-value">
                  {records.maxVolume ? formatVolume(records.maxVolume.value) : '—'} <small>{weightUnit()}</small>
                </div>
                <div className="stat-label">Objętość w treningu</div>
              </div>
            </div>
            )}
          </section>

          <section className="section">
            <h2 className="label">Ostatnie treningi</h2>
            <ul className="list">
              {recent.map(({ w, sets }) => (
                <li key={w.id}>
                  <Link className="item" to={`/historia/${w.id}`}>
                    <span className="item-main">
                      <span className="item-title">{formatDay(w.startedAt)}</span>
                      <span className="item-sub">
                        {sets.map((s) => formatEntrySet(s, timed)).join(' · ')}
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
        </>
      )}

      <ExerciseForm open={dialog === 'edit'} onClose={() => setDialog(null)} initial={exercise} />
      <Confirm
        open={dialog === 'archive'}
        onClose={() => setDialog(null)}
        onConfirm={() => {
          store.saveExercise({ ...exercise, archived: true, updatedAt: new Date().toISOString() });
          navigate('/cwiczenia');
        }}
        title="Zarchiwizować ćwiczenie?"
        message="Ćwiczenie zniknie z listy i nie będzie można go dodać do treningu. Zapisane serie zostaną w historii."
        confirmLabel="Archiwizuj"
      />
    </main>
  );
}
