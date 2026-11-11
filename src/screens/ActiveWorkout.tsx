import { useEffect, useMemo, useState } from 'react';
import { lastPerformance, newRecordExerciseIds } from '../domain/stats';
import type { Workout, WorkoutSet } from '../domain/types';
import { addEntry, addSet, finishWorkout, removeEntry, removeSet, updateSet } from '../domain/workout';
import { useRestTimer } from '../state/restTimer';
import { useStore } from '../state/store';
import { guideFor } from '../domain/guides';
import { ExercisePicker } from '../ui/ExerciseBrowser';
import { ExerciseGuide } from '../ui/ExerciseGuide';
import { formatClock, formatSet } from '../ui/format';
import { Icon } from '../ui/Icon';
import { NumberField } from '../ui/NumberField';
import { Confirm, Sheet } from '../ui/Sheet';
import type { WorkoutSummary } from './TrainingScreen';

/** Seconds since `startedAt`, refreshed every second. */
function useElapsedSeconds(startedAt: string): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return (now - Date.parse(startedAt)) / 1000;
}

type Dialog = 'picker' | 'finish' | 'empty' | 'cancel' | null;

export function ActiveWorkout({ workout, onFinished }: { workout: Workout; onFinished(summary: WorkoutSummary): void }) {
  const store = useStore();
  const rest = useRestTimer();
  const elapsed = useElapsedSeconds(workout.startedAt);
  const [dialog, setDialog] = useState<Dialog>(null);
  /** Exercise whose how-to sheet is open. */
  const [guideId, setGuideId] = useState<string | null>(null);
  const history = useMemo(() => store.workouts.filter((w) => w.finishedAt), [store.workouts]);

  const save = store.saveWorkout;
  const hasOpenSets = workout.entries.some((e) => e.sets.some((s) => !s.done));

  function toggleDone(entryIndex: number, setIndex: number, set: WorkoutSet) {
    save(updateSet(workout, entryIndex, setIndex, { done: !set.done }));
    if (!set.done) rest.start(store.settings.restSeconds);
  }

  function finish() {
    const finished = finishWorkout(workout, new Date().toISOString());
    if (!finished) {
      setDialog('empty');
      return;
    }
    const recordExerciseIds = newRecordExerciseIds(finished, history);
    rest.stop();
    save(finished);
    onFinished({ workout: finished, recordExerciseIds });
  }

  function discard() {
    rest.stop();
    store.removeWorkout(workout.id);
  }

  return (
    <main className="screen">
      <div className="header">
        <span className="spacer" />
        <button
          type="button"
          className="btn btn-primary btn-small"
          style={{ marginRight: 10 }}
          onClick={() => (hasOpenSets && finishWorkout(workout, '') ? setDialog('finish') : finish())}
        >
          Zakończ
        </button>
      </div>

      <input
        className="workout-name"
        aria-label="Nazwa treningu"
        value={workout.name}
        maxLength={60}
        onChange={(e) => save({ ...workout, name: e.target.value })}
        onBlur={() => workout.name.trim() === '' && save({ ...workout, name: 'Trening' })}
      />
      <p className="clock" role="timer" aria-label="Czas treningu">
        {formatClock(elapsed)}
      </p>

      {workout.entries.length === 0 && <p className="empty">Dodaj pierwsze ćwiczenie, żeby zacząć zapisywać serie.</p>}

      {workout.entries.map((entry, entryIndex) => {
        const previous = lastPerformance(history, entry.exerciseId);
        const name = store.exerciseName(entry.exerciseId);
        return (
          <section className="entry" key={entryIndex}>
            <div className="entry-head">
              <h2>
                {guideFor(entry.exerciseId) ? (
                  <button type="button" className="entry-name" onClick={() => setGuideId(entry.exerciseId)}>
                    {name}
                    <span className="entry-hint">Jak wykonać</span>
                  </button>
                ) : (
                  name
                )}
              </h2>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Usuń ćwiczenie: ${name}`}
                onClick={() => save(removeEntry(workout, entryIndex))}
              >
                <Icon name="close" />
              </button>
            </div>
            <div className="sets">
              <div className="sets-head" aria-hidden="true">
                <span>#</span>
                <span>Poprzednio</span>
                <span>kg</span>
                <span>Powt.</span>
                <span />
              </div>
              {entry.sets.map((set, setIndex) => {
                const prev = previous[setIndex];
                const n = setIndex + 1;
                return (
                  <div className={set.done ? 'set-row done' : 'set-row'} key={setIndex}>
                    <span className="set-index">{n}</span>
                    <span className="set-prev">{prev ? formatSet(prev.weight, prev.reps) : '—'}</span>
                    <NumberField
                      label={`${name}, seria ${n}, ciężar w kg`}
                      value={set.weight}
                      onChange={(weight) => save(updateSet(workout, entryIndex, setIndex, { weight }))}
                    />
                    <NumberField
                      integer
                      label={`${name}, seria ${n}, powtórzenia`}
                      value={set.reps}
                      onChange={(reps) => save(updateSet(workout, entryIndex, setIndex, { reps }))}
                    />
                    <button
                      type="button"
                      className="check"
                      aria-pressed={set.done}
                      aria-label={`${name}, seria ${n}: zrobiona`}
                      disabled={!set.done && set.reps === 0}
                      onClick={() => toggleDone(entryIndex, setIndex, set)}
                    >
                      <Icon name="check" />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="entry-foot">
              <button type="button" className="btn btn-small" onClick={() => save(addSet(workout, entryIndex))}>
                <Icon name="plus" />
                Seria
              </button>
              <button
                type="button"
                className="btn btn-small btn-quiet"
                disabled={entry.sets.length <= 1}
                onClick={() => save(removeSet(workout, entryIndex, entry.sets.length - 1))}
              >
                <Icon name="minus" />
                Usuń ostatnią
              </button>
            </div>
          </section>
        );
      })}

      <div className="section stack">
        <button type="button" className="btn btn-block" onClick={() => setDialog('picker')}>
          <Icon name="plus" />
          Dodaj ćwiczenie
        </button>
        <button type="button" className="btn btn-danger btn-block" onClick={() => setDialog('cancel')}>
          Anuluj trening
        </button>
      </div>

      <Sheet open={guideId !== null} onClose={() => setGuideId(null)} title={guideId ? store.exerciseName(guideId) : ''}>
        {guideId && <ExerciseGuide exerciseId={guideId} name={store.exerciseName(guideId)} />}
      </Sheet>
      <ExercisePicker
        open={dialog === 'picker'}
        onClose={() => setDialog(null)}
        onPick={(id) => save(addEntry(workout, id, history))}
      />
      <Confirm
        open={dialog === 'finish'}
        onClose={() => setDialog(null)}
        onConfirm={finish}
        title="Zakończyć trening?"
        message="Serie, które nie zostały odhaczone, nie zapiszą się w historii."
        confirmLabel="Zakończ"
        cancelLabel="Wróć do treningu"
      />
      <Confirm
        open={dialog === 'empty'}
        onClose={() => setDialog(null)}
        onConfirm={discard}
        title="Brak odhaczonych serii"
        message="Ten trening nie ma żadnej zrobionej serii, więc nie ma czego zapisać. Odrzucić go?"
        confirmLabel="Odrzuć trening"
        cancelLabel="Wróć do treningu"
      />
      <Confirm
        open={dialog === 'cancel'}
        onClose={() => setDialog(null)}
        onConfirm={discard}
        title="Anulować trening?"
        message="Wszystkie serie z tego treningu zostaną usunięte. Tej operacji nie można cofnąć."
        confirmLabel="Anuluj trening"
        cancelLabel="Wróć do treningu"
      />
    </main>
  );
}
