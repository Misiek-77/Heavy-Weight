import { useMemo, useState } from 'react';
import { newId } from '../domain/id';
import { EQUIPMENT, MUSCLE_GROUPS, type Exercise, type MuscleGroup } from '../domain/types';
import { useStore } from '../state/store';
import { searchKey } from './format';
import { Icon } from './Icon';
import { Sheet } from './Sheet';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Searchable, filterable list of the exercises that are not archived. */
export function ExerciseBrowser({ onSelect }: { onSelect(exercise: Exercise): void }) {
  const { exercises } = useStore();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<MuscleGroup | null>(null);

  const visible = useMemo(() => {
    const key = searchKey(query.trim());
    return exercises
      .filter((e) => !e.archived && (!group || e.muscleGroup === group) && searchKey(e.name).includes(key))
      .sort((a, b) => a.name.localeCompare(b.name, 'pl'));
  }, [exercises, query, group]);

  return (
    <>
      <input
        className="input"
        type="search"
        placeholder="Szukaj ćwiczenia"
        aria-label="Szukaj ćwiczenia"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="chips" role="group" aria-label="Partia mięśniowa">
        <button type="button" className="chip" aria-pressed={group === null} onClick={() => setGroup(null)}>
          Wszystkie
        </button>
        {MUSCLE_GROUPS.map((g) => (
          <button key={g} type="button" className="chip" aria-pressed={group === g} onClick={() => setGroup(g)}>
            {capitalize(g)}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <p className="empty">Brak ćwiczeń pasujących do wyszukiwania.</p>
      ) : (
        <ul className="list">
          {visible.map((e) => (
            <li key={e.id}>
              <button type="button" className="item" onClick={() => onSelect(e)}>
                <span className="item-main">
                  <span className="item-title">{e.name}</span>
                  <span className="item-sub" style={{ display: 'block' }}>
                    {capitalize(e.muscleGroup)} · {e.equipment}
                    {e.custom && ' · własne'}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Sheet for choosing one exercise, e.g. to add it to a workout or a plan. */
export function ExercisePicker({ open, onClose, onPick }: { open: boolean; onClose(): void; onPick(id: string): void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Dodaj ćwiczenie">
      <ExerciseBrowser
        onSelect={(e) => {
          onClose();
          onPick(e.id);
        }}
      />
    </Sheet>
  );
}

/** Sheet with the form for creating or editing a custom exercise. */
export function ExerciseForm({ open, onClose, initial }: { open: boolean; onClose(): void; initial?: Exercise }) {
  return (
    <Sheet open={open} onClose={onClose} title={initial ? 'Edytuj ćwiczenie' : 'Nowe ćwiczenie'}>
      <ExerciseFields initial={initial} onDone={onClose} />
    </Sheet>
  );
}

function ExerciseFields({ initial, onDone }: { initial?: Exercise; onDone(): void }) {
  const { saveExercise } = useStore();
  const [name, setName] = useState(initial?.name ?? '');
  const [muscleGroup, setMuscleGroup] = useState(initial?.muscleGroup ?? MUSCLE_GROUPS[0]);
  const [equipment, setEquipment] = useState(initial?.equipment ?? EQUIPMENT[0]);

  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        saveExercise({
          id: initial?.id ?? newId(),
          name: name.trim(),
          muscleGroup,
          equipment,
          custom: true,
          archived: false,
          updatedAt: new Date().toISOString(),
        });
        onDone();
      }}
    >
      <label className="field">
        <span>Nazwa</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={80} />
      </label>
      <label className="field">
        <span>Partia mięśniowa</span>
        <select className="select" value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}>
          {MUSCLE_GROUPS.map((g) => (
            <option key={g} value={g}>
              {capitalize(g)}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Sprzęt</span>
        <select className="select" value={equipment} onChange={(e) => setEquipment(e.target.value as Exercise['equipment'])}>
          {EQUIPMENT.map((x) => (
            <option key={x} value={x}>
              {capitalize(x)}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="btn btn-primary btn-block" disabled={name.trim() === ''}>
        <Icon name="check" />
        Zapisz
      </button>
    </form>
  );
}
