import { Fragment, useEffect, useMemo, useState } from 'react';
import { guideFor } from '../domain/guides';
import { isStalled, lastPerformance, liveRecord, newRecordExerciseIds, STALL_SESSIONS } from '../domain/stats';
import { RIR_VALUES, SET_KINDS, type Workout, type WorkoutEntry, type WorkoutSet } from '../domain/types';
import {
  addEntry,
  addWarmup,
  deloadEntry,
  addSet,
  finishWorkout,
  removeEntry,
  removeSet,
  setLabels,
  setEntryNote,
  shouldIncrease,
  swapExercise,
  toggleLink,
  updateSet,
} from '../domain/workout';
import { useRestControls } from '../state/restTimer';
import { useStore } from '../state/store';
import { ExercisePicker } from '../ui/ExerciseBrowser';
import { ExerciseGuide } from '../ui/ExerciseGuide';
import { ExerciseThumb } from '../ui/ExerciseThumb';
import { displayWeight, formatClock, formatEntrySet, formatRange, formatWeight, fromUnit, weightStep, weightUnit } from '../ui/format';
import { Icon } from '../ui/Icon';
import { NoteField } from '../ui/NoteField';
import { NumberField } from '../ui/NumberField';
import { PlateCalculator } from '../ui/PlateCalculator';
import { rirLabel, SET_KIND_INFO } from '../ui/setKinds';
import { Confirm, Sheet } from '../ui/Sheet';
import { useWakeLock } from '../ui/useWakeLock';
import type { WorkoutSummary } from './TrainingScreen';

/** Time since the workout started. Its own component, so the tick redraws one line and not the whole screen. */
function Clock({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <p className="clock" role="timer" aria-label="Czas treningu">
      {formatClock((now - Date.parse(startedAt)) / 1000)}
    </p>
  );
}

/** Warm-up sets can be suggested once a working weight is typed and none have been added yet. */
const canWarmUp = (entry: WorkoutEntry, timed: boolean) =>
  !timed && entry.sets.some((s) => s.weight > 0 && !s.done) && !entry.sets.some((s) => s.kind === 'warmup');

type Dialog = 'picker' | 'finish' | 'empty' | 'cancel' | null;

const RECORD_LABEL = { weight: 'Nowy rekord ciężaru', oneRepMax: 'Nowy rekord siły', time: 'Nowy rekord czasu' };

export function ActiveWorkout({ workout, onFinished }: { workout: Workout; onFinished(summary: WorkoutSummary): void }) {
  const store = useStore();
  const rest = useRestControls();
  useWakeLock(true);
  const planNote = workout.planId ? store.plans.find((p) => p.id === workout.planId)?.note : undefined;
  const [dialog, setDialog] = useState<Dialog>(null);
  /** Exercise whose how-to sheet is open. */
  const [guideId, setGuideId] = useState<string | null>(null);
  /** Set whose kind is being chosen. */
  const [kindTarget, setKindTarget] = useState<{ entryIndex: number; setIndex: number } | null>(null);
  /** Weight the plate calculator opens with, or null while it is closed. */
  const [plates, setPlates] = useState<number | null>(null);
  /** Entry being swapped for another exercise. */
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  /** Message shown briefly after a record-breaking set. */
  const [record, setRecord] = useState<string | null>(null);
  useEffect(() => {
    if (!record) return;
    const id = setTimeout(() => setRecord(null), 5000);
    return () => clearTimeout(id);
  }, [record]);

  const exercises = useMemo(() => new Map(store.exercises.map((e) => [e.id, e])), [store.exercises]);
  const history = useMemo(() => store.workouts.filter((w) => w.finishedAt), [store.workouts]);
  const exerciseIds = workout.entries.map((e) => e.exerciseId).join('|');
  const previousSets = useMemo(
    () => new Map(exerciseIds.split('|').map((id) => [id, lastPerformance(history, id)])),
    [history, exerciseIds],
  );
  const stalled = useMemo(
    () => new Set(exerciseIds.split('|').filter((id) => isStalled(history, id, exercises.get(id)?.timed))),
    [history, exerciseIds, exercises],
  );
  /** Entries already made lighter in this workout, so the suggestion is not repeated. */
  const [deloaded, setDeloaded] = useState<ReadonlySet<number>>(new Set());
  const save = store.saveWorkout;
  const hasOpenSets = workout.entries.some((e) => e.sets.some((s) => !s.done));
  const swapped = swapIndex === null ? undefined : exercises.get(workout.entries[swapIndex]?.exerciseId ?? '');

  function toggleDone(entryIndex: number, setIndex: number, set: WorkoutSet) {
    const next = updateSet(workout, entryIndex, setIndex, { done: !set.done });
    save(next);
    if (set.done) return;
    const entry = workout.entries[entryIndex];
    const exercise = exercises.get(entry.exerciseId);
    // In a superset the rest comes only after the last exercise of the group.
    if (!entry.linkNext) rest.start(exercise?.restSeconds ?? store.settings.restSeconds, store.settings.restSound);
    const kind = liveRecord(next, entryIndex, setIndex, history, exercise?.timed);
    if (kind) {
      setRecord(`${RECORD_LABEL[kind]}: ${store.exerciseName(entry.exerciseId)}, ${formatEntrySet(set, exercise?.timed)}`);
    }
  }

  function finish() {
    const finished = finishWorkout(workout, new Date().toISOString());
    if (!finished) {
      setDialog('empty');
      return;
    }
    const recordExerciseIds = newRecordExerciseIds(finished, history, store.timedIds);
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
      <Clock startedAt={workout.startedAt} />
      {planNote && (
        <p className="plan-note" role="note">
          {planNote}
        </p>
      )}
      <NoteField
        label="Notatka do treningu"
        placeholder="Notatka do treningu"
        value={workout.note ?? ''}
        onChange={(note) => save({ ...workout, note })}
      />

      {workout.entries.length === 0 && <p className="empty">Dodaj pierwsze ćwiczenie, żeby zacząć zapisywać serie.</p>}

      {workout.entries.map((entry, entryIndex) => {
        const exercise = exercises.get(entry.exerciseId);
        const timed = exercise?.timed ?? false;
        const previous = previousSets.get(entry.exerciseId) ?? [];
        const name = store.exerciseName(entry.exerciseId);
        const range = formatRange(entry.repMin, entry.repMax, timed);
        const isLast = entryIndex === workout.entries.length - 1;
        const labels = setLabels(entry.sets);
        return (
          <Fragment key={entryIndex}>
            <section className={entry.linkNext ? 'entry linked' : 'entry'}>
              <div className="entry-head">
                <h2>
                  {guideFor(entry.exerciseId) ? (
                    <button type="button" className="entry-name" onClick={() => setGuideId(entry.exerciseId)}>
                      <ExerciseThumb exerciseId={entry.exerciseId} large />
                      <span>
                        {name}
                        <span className="entry-hint">Jak wykonać</span>
                      </span>
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
              {range && (
                <p className="entry-target">
                  Cel: {range}
                  {shouldIncrease(previous, entry.repMax) &&
                    ` · poprzednio górna granica w każdej serii, więc dodano ${formatWeight(weightStep())} ${weightUnit()}`}
                </p>
              )}
              {stalled.has(entry.exerciseId) && !deloaded.has(entryIndex) && entry.sets.some((s) => !s.done && s.weight > 0) && (
                <div className="stall-hint" role="note">
                  <p>
                    <strong>Bez postępu od {STALL_SESSIONS} treningów.</strong> Lżejszy trening pozwala odpocząć i ruszyć dalej. Możesz też
                    zmienić zakres powtórzeń w planie.
                  </p>
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() => {
                      save(deloadEntry(workout, entryIndex, weightStep()));
                      setDeloaded(new Set([...deloaded, entryIndex]));
                    }}
                  >
                    Lżej o 10%
                  </button>
                </div>
              )}
              <div className="sets">
                <div className="sets-head" aria-hidden="true">
                  <span>#</span>
                  <span>Poprzednio</span>
                  <span>{weightUnit()}</span>
                  <span>{timed ? 'Sek.' : 'Powt.'}</span>
                  <span />
                </div>
                {entry.sets.map((set, setIndex) => {
                  const prev = previous[setIndex];
                  // Position, for field labels that must stay unique. What is shown counts working sets from 1.
                  const n = setIndex + 1;
                  return (
                    <div className={set.done ? 'set-row done' : 'set-row'} key={setIndex}>
                      <button
                        type="button"
                        className={set.kind && set.kind !== 'normal' ? `set-index kind-${set.kind}` : 'set-index'}
                        aria-label={`${name}, seria ${n}: rodzaj serii i zapas powtórzeń, teraz ${SET_KIND_INFO[set.kind ?? 'normal'].label.toLowerCase()}${set.rir !== undefined ? `, zapas ${rirLabel(set.rir)}` : ''}`}
                        onClick={() => setKindTarget({ entryIndex, setIndex })}
                      >
                        {SET_KIND_INFO[set.kind ?? 'normal'].mark || labels[setIndex]}
                        {set.rir !== undefined && <small className="rir">@{rirLabel(set.rir)}</small>}
                      </button>
                      <span className="set-prev">{prev ? formatEntrySet(prev, timed) : '—'}</span>
                      <NumberField
                        label={`${name}, seria ${n}, ciężar w ${weightUnit()}`}
                        value={displayWeight(set.weight)}
                        onChange={(weight) => save(updateSet(workout, entryIndex, setIndex, { weight: fromUnit(weight) }))}
                      />
                      <NumberField
                        integer
                        label={`${name}, seria ${n}, ${timed ? 'czas w sekundach' : 'powtórzenia'}`}
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
              <NoteField
                label={`Notatka do ćwiczenia: ${name}`}
                placeholder="Notatka do ćwiczenia"
                value={entry.note ?? ''}
                onChange={(note) => save(setEntryNote(workout, entryIndex, note))}
              />
              <div className="entry-foot">
                <button type="button" className="btn btn-small" onClick={() => save(addSet(workout, entryIndex, history))}>
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
              <div className="entry-tools">
                {exercise?.equipment === 'sztanga' && (
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => setPlates((entry.sets.find((s) => !s.done) ?? entry.sets.at(-1))?.weight ?? 0)}
                  >
                    Talerze
                  </button>
                )}
                {canWarmUp(entry, timed) && (
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => {
                      // The empty bar opens the warm-up with a barbell: 20 kg, or a 45 lb bar.
                      const bar = exercise?.equipment === 'sztanga' ? fromUnit(weightUnit() === 'lb' ? 45 : 20) : 0;
                      save(addWarmup(workout, entryIndex, { bar, step: weightStep() }));
                    }}
                  >
                    Rozgrzewka
                  </button>
                )}
                <button type="button" className="link-btn" onClick={() => setSwapIndex(entryIndex)}>
                  Zamień ćwiczenie
                </button>
                {!isLast && (
                  <button
                    type="button"
                    className="link-btn"
                    aria-pressed={!!entry.linkNext}
                    onClick={() => save(toggleLink(workout, entryIndex))}
                  >
                    {entry.linkNext ? 'Rozłącz super serię' : 'Super seria z następnym'}
                  </button>
                )}
              </div>
            </section>
            {entry.linkNext && !isLast && (
              <p className="superset-link">Super seria · bez przerwy, od razu następne ćwiczenie</p>
            )}
          </Fragment>
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

      <p className="toast" role="status">
        {record && (
          <>
            <Icon name="check" />
            {record}
          </>
        )}
      </p>

      <PlateCalculator open={plates !== null} onClose={() => setPlates(null)} initialWeight={plates ?? 0} />
      <ExercisePicker
        open={swapIndex !== null}
        onClose={() => setSwapIndex(null)}
        title={swapped ? `Zamień: ${swapped.name}` : 'Zamień ćwiczenie'}
        filter={swapped ? (e) => e.muscleGroup === swapped.muscleGroup && e.id !== swapped.id : undefined}
        onPick={(id) => swapIndex !== null && save(swapExercise(workout, swapIndex, id, history, weightStep()))}
      />
      <Sheet open={kindTarget !== null} onClose={() => setKindTarget(null)} title="Seria">
        <h3 className="label">Zapas powtórzeń (RIR)</h3>
        <p className="muted small" style={{ marginTop: 4 }}>
          Ile powtórzeń dałbyś jeszcze radę zrobić. Gdy przy każdej serii zostają 3 lub więcej, następnym razem aplikacja doda ciężar.
        </p>
        <div className="chips" role="group" aria-label="Zapas powtórzeń" style={{ marginBottom: 18 }}>
          {RIR_VALUES.map((rir) => {
            const current = kindTarget && workout.entries[kindTarget.entryIndex]?.sets[kindTarget.setIndex]?.rir;
            return (
              <button
                key={rir}
                type="button"
                className="chip"
                aria-pressed={current === rir}
                onClick={() => {
                  // Tapping the chosen value again clears it.
                  if (kindTarget) save(updateSet(workout, kindTarget.entryIndex, kindTarget.setIndex, { rir: current === rir ? undefined : rir }));
                }}
              >
                {rirLabel(rir)}
              </button>
            );
          })}
        </div>
        <h3 className="label">Rodzaj serii</h3>
        <ul className="list">
          {SET_KINDS.map((kind) => {
            const current =
              kindTarget && (workout.entries[kindTarget.entryIndex]?.sets[kindTarget.setIndex]?.kind ?? 'normal');
            return (
              <li key={kind}>
                <button
                  type="button"
                  className="item"
                  aria-pressed={current === kind}
                  onClick={() => {
                    if (kindTarget) save(updateSet(workout, kindTarget.entryIndex, kindTarget.setIndex, { kind }));
                    setKindTarget(null);
                  }}
                >
                  <span className={`set-index kind-${kind}`} aria-hidden="true">
                    {SET_KIND_INFO[kind].mark || '1'}
                  </span>
                  <span className="item-main">
                    <span className="item-title">{SET_KIND_INFO[kind].label}</span>
                    <span className="item-sub">
                      {SET_KIND_INFO[kind].hint}
                    </span>
                  </span>
                  {current === kind && (
                    <span className="item-end">
                      <Icon name="check" />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
          {kindTarget && (
            <SupersetChoice
              workout={workout}
              entryIndex={kindTarget.entryIndex}
              name={store.exerciseName}
              onToggle={(i) => {
                save(toggleLink(workout, i));
                setKindTarget(null);
              }}
            />
          )}
        </ul>
      </Sheet>
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

/**
 * "Łączona (super seria)" among the set kinds: a superset joins whole exercises, done in turns with the rest
 * only after both, so choosing it links this exercise with the next one (the last one with the one before).
 */
function SupersetChoice({
  workout,
  entryIndex,
  name,
  onToggle,
}: {
  workout: Workout;
  entryIndex: number;
  name(exerciseId: string): string;
  onToggle(linkIndex: number): void;
}) {
  const entries = workout.entries;
  const entry = entries[entryIndex];
  const before = entries[entryIndex - 1];
  if (!entry) return null;
  // The link to toggle: this exercise's own, or the previous one's when this is the last exercise.
  const linkIndex = entry.linkNext ? entryIndex : before?.linkNext ? entryIndex - 1 : entryIndex < entries.length - 1 ? entryIndex : entryIndex - 1;
  const partner = entries[linkIndex === entryIndex ? entryIndex + 1 : entryIndex - 1];
  const linked = linkIndex >= 0 && !!entries[linkIndex]?.linkNext;
  const disabled = entries.length < 2 || linkIndex < 0;
  return (
    <li>
      <button type="button" className="item" aria-pressed={linked} disabled={disabled} onClick={() => onToggle(linkIndex)}>
        <span className="set-index kind-superset" aria-hidden="true">
          S
        </span>
        <span className="item-main">
          <span className="item-title">Łączona (super seria)</span>
          <span className="item-sub">
            {disabled
              ? 'Dodaj drugie ćwiczenie, żeby połączyć je w super serię.'
              : linked
                ? `Połączone z: ${name(partner.exerciseId)}. Dotknij, żeby rozłączyć.`
                : `Na zmianę z: ${name(partner.exerciseId)}, przerwa dopiero po obu ćwiczeniach.`}
          </span>
        </span>
        {linked && (
          <span className="item-end">
            <Icon name="check" />
          </span>
        )}
      </button>
    </li>
  );
}
