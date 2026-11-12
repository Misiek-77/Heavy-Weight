import { useState } from 'react';
import { newId } from '../domain/id';
import { goalProgress } from '../domain/insights';
import type { Goal } from '../domain/types';
import { useStore } from '../state/store';
import { ExercisePicker } from '../ui/ExerciseBrowser';
import { formatWeight, fromUnit, plural, weightUnit } from '../ui/format';
import { Icon } from '../ui/Icon';
import { NumberField } from '../ui/NumberField';
import { Confirm, Sheet } from '../ui/Sheet';

/** Goals with their progress bars, plus the sheet for adding one. */
export function GoalsSection({ now }: { now: Date }) {
  const store = useStore();
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Goal | null>(null);

  return (
    <section className="section">
      <h2 className="label">Cele</h2>
      {store.goals.length === 0 ? (
        <p className="empty">Ustaw cel, np. konkretny ciężar w wyciskaniu albo 3 treningi w tygodniu.</p>
      ) : (
        <ul className="goals">
          {store.goals.map((goal) => {
            const p = goalProgress(goal, store.workouts, now);
            const title =
              goal.kind === 'lift'
                ? `${store.exerciseName(goal.exerciseId)}: ${formatWeight(goal.targetWeight)} ${weightUnit()}`
                : `${plural(goal.perWeek, 'trening', 'treningi', 'treningów')} w tygodniu`;
            const status =
              goal.kind === 'lift'
                ? p.reached
                  ? `Osiągnięty — najcięższa seria ${formatWeight(p.current)} ${weightUnit()}`
                  : `Najcięższa seria ${formatWeight(p.current)} ${weightUnit()}, brakuje ${formatWeight(p.target - p.current)} ${weightUnit()}`
                : p.reached
                  ? `Osiągnięty w tym tygodniu (${p.current} z ${p.target})`
                  : `${p.current} z ${p.target} w tym tygodniu`;
            return (
              <li key={goal.id} className={p.reached ? 'goal reached' : 'goal'}>
                <div className="goal-head">
                  <span className="item-title">{title}</span>
                  <button type="button" className="icon-btn" aria-label={`Usuń cel: ${title}`} onClick={() => setRemoving(goal)}>
                    <Icon name="trash" />
                  </button>
                </div>
                <div
                  className="bar-track"
                  role="progressbar"
                  aria-label={title}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(p.ratio * 100)}
                >
                  <span className="bar-fill" style={{ width: `${p.ratio * 100}%` }} />
                </div>
                <p className="item-sub">{status}</p>
              </li>
            );
          })}
        </ul>
      )}
      <button type="button" className="btn btn-block" style={{ marginTop: 14 }} onClick={() => setAdding(true)}>
        <Icon name="plus" />
        Dodaj cel
      </button>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Nowy cel">
        {adding && <GoalForm onDone={() => setAdding(false)} />}
      </Sheet>
      <Confirm
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && store.removeGoal(removing.id)}
        title="Usunąć cel?"
        message="Cel zniknie z listy. Twoje treningi i wyniki zostają bez zmian."
        confirmLabel="Usuń cel"
      />
    </section>
  );
}

function GoalForm({ onDone }: { onDone(): void }) {
  const store = useStore();
  const [kind, setKind] = useState<Goal['kind']>('lift');
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [targetWeight, setTargetWeight] = useState(0);
  const [perWeek, setPerWeek] = useState(3);
  const [picking, setPicking] = useState(false);
  const valid = kind === 'frequency' ? perWeek > 0 : exerciseId !== null && targetWeight > 0;

  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        store.saveGoal(
          kind === 'lift' ? { id: newId(), kind, exerciseId: exerciseId!, targetWeight: fromUnit(targetWeight) } : { id: newId(), kind, perWeek },
        );
        onDone();
      }}
    >
      <div className="chips" role="group" aria-label="Rodzaj celu">
        <button type="button" className="chip" aria-pressed={kind === 'lift'} onClick={() => setKind('lift')}>
          Ciężar w ćwiczeniu
        </button>
        <button type="button" className="chip" aria-pressed={kind === 'frequency'} onClick={() => setKind('frequency')}>
          Treningi w tygodniu
        </button>
      </div>

      {kind === 'lift' ? (
        <>
          <button type="button" className="btn btn-block" onClick={() => setPicking(true)}>
            {exerciseId ? store.exerciseName(exerciseId) : 'Wybierz ćwiczenie'}
          </button>
          <label className="field">
            <span>Docelowy ciężar ({weightUnit()})</span>
            <NumberField label={`Docelowy ciężar w ${weightUnit()}`} value={targetWeight} onChange={setTargetWeight} />
          </label>
        </>
      ) : (
        <div className="item" style={{ minHeight: 0, padding: 0 }}>
          <span className="item-main">Treningów w tygodniu</span>
          <div className="stepper" role="group" aria-label="Liczba treningów w tygodniu">
            <button type="button" className="icon-btn" aria-label="Mniej" disabled={perWeek <= 1} onClick={() => setPerWeek(perWeek - 1)}>
              <Icon name="minus" />
            </button>
            <output>{perWeek}</output>
            <button type="button" className="icon-btn" aria-label="Więcej" disabled={perWeek >= 7} onClick={() => setPerWeek(perWeek + 1)}>
              <Icon name="plus" />
            </button>
          </div>
        </div>
      )}

      <button type="submit" className="btn btn-primary btn-block" disabled={!valid}>
        Zapisz cel
      </button>
      <ExercisePicker open={picking} onClose={() => setPicking(false)} title="Ćwiczenie dla celu" onPick={setExerciseId} />
    </form>
  );
}
