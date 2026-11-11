import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { exerciseRecords, finishedWorkouts, progressSeries } from '../domain/stats';
import { useStore } from '../state/store';
import { Header } from '../ui/Chrome';
import { ExerciseBrowser, ExerciseForm } from '../ui/ExerciseBrowser';
import { formatDay, formatSet, formatWeight, formatWhole } from '../ui/format';
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
  const series = progressSeries(store.workouts, id);
  const weighted = series.some((p) => p.value > 0);
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
        {exercise.muscleGroup} · {exercise.equipment}
        {exercise.archived && ' · zarchiwizowane'}
      </p>

      {recent.length === 0 ? (
        <p className="empty">Nie masz jeszcze zapisanych serii tego ćwiczenia.</p>
      ) : (
        <>
          {weighted && (
            <section className="section">
              <h2 className="label">Szacowany maks. na 1 powtórzenie</h2>
              <LineChart points={series} unit="kg" />
            </section>
          )}

          <section className="section">
            <h2 className="label">Rekordy</h2>
            <div className="stats" style={{ marginTop: 12 }}>
              <div>
                <div className="stat-value">
                  {records.maxWeight ? formatWeight(records.maxWeight.weight) : '—'} <small>kg</small>
                </div>
                <div className="stat-label">
                  Najcięższa seria{records.maxWeight && ` · ${records.maxWeight.reps} powt.`}
                </div>
              </div>
              <div>
                <div className="stat-value">
                  {records.best1RM ? formatWeight(Math.round(records.best1RM.value * 10) / 10) : '—'} <small>kg</small>
                </div>
                <div className="stat-label">Szacowane 1RM</div>
              </div>
              <div>
                <div className="stat-value">
                  {records.maxVolume ? formatWhole(records.maxVolume.value) : '—'} <small>kg</small>
                </div>
                <div className="stat-label">Objętość w treningu</div>
              </div>
            </div>
          </section>

          <section className="section">
            <h2 className="label">Ostatnie treningi</h2>
            <ul className="list">
              {recent.map(({ w, sets }) => (
                <li key={w.id}>
                  <Link className="item" to={`/historia/${w.id}`}>
                    <span className="item-main">
                      <span className="item-title">{formatDay(w.startedAt)}</span>
                      <span className="item-sub" style={{ display: 'block' }}>
                        {sets.map((s) => formatSet(s.weight, s.reps)).join(' · ')}
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
