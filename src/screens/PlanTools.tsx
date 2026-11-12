import { useMemo, useState } from 'react';
import { WIZARD_DAYS, WIZARD_GOALS, generatePlans, type WizardGoal } from '../domain/wizard';
import { useStore } from '../state/store';
import { plural } from '../ui/format';
import { Sheet } from '../ui/Sheet';

const WEEKDAYS = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];

/** Which plan to do on each day of the week. */
export function WeekSchedule() {
  const store = useStore();
  const { schedule } = store.settings;
  const today = (new Date().getDay() + 6) % 7;

  return (
    <section className="section">
      <h2 className="label">Harmonogram tygodnia</h2>
      <p className="muted small" style={{ marginTop: 6 }}>
        Plan przypisany do dnia pojawi się na ekranie Trening jako „Dziś”.
      </p>
      <ul className="schedule">
        {WEEKDAYS.map((day, i) => (
          <li key={day}>
            <label>
              <span className={i === today ? 'schedule-day today' : 'schedule-day'}>{day}</span>
              <select
                className="select"
                // A plan deleted after it was scheduled shows as a rest day.
                value={store.plans.some((p) => p.id === schedule[i]) ? schedule[i]! : ''}
                onChange={(e) =>
                  store.saveSettings({
                    ...store.settings,
                    schedule: schedule.map((id, j) => (j === i ? e.target.value || null : id)),
                  })
                }
              >
                <option value="">Odpoczynek</option>
                {store.plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}

const GOAL_INFO: Record<WizardGoal, { label: string; hint: string }> = {
  strength: { label: 'Siła', hint: 'Ciężko i krótko: 4–6 powtórzeń w głównych ćwiczeniach.' },
  muscle: { label: 'Masa mięśniowa', hint: 'Średni ciężar, 8–12 powtórzeń.' },
  fitness: { label: 'Ogólna forma', hint: 'Lżej i więcej: 10–15 powtórzeń, mniej serii.' },
};

/** Sheet that builds a week of plans from two answers: how many days and what for. */
export function PlanWizard({ open, onClose }: { open: boolean; onClose(): void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Kreator planu">
      {open && <Wizard onDone={onClose} />}
    </Sheet>
  );
}

function Wizard({ onDone }: { onDone(): void }) {
  const store = useStore();
  const [days, setDays] = useState<number>(3);
  const [goal, setGoal] = useState<WizardGoal>('muscle');
  const [schedule, setSchedule] = useState(true);
  // Regenerated only when an answer changes, so the preview and the saved plans are the same objects.
  const result = useMemo(
    () => generatePlans(days, goal, store.plans, new Date().toISOString()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [days, goal],
  );

  return (
    <div className="stack">
      <div>
        <span className="label">Ile dni w tygodniu</span>
        <div className="chips" role="group" aria-label="Liczba dni treningowych" style={{ marginTop: 8 }}>
          {WIZARD_DAYS.map((d) => (
            <button key={d} type="button" className="chip" aria-pressed={days === d} onClick={() => setDays(d)}>
              {d}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="label">Cel</span>
        <div className="chips" role="group" aria-label="Cel treningów" style={{ marginTop: 8 }}>
          {WIZARD_GOALS.map((g) => (
            <button key={g} type="button" className="chip" aria-pressed={goal === g} onClick={() => setGoal(g)}>
              {GOAL_INFO[g].label}
            </button>
          ))}
        </div>
        <p className="muted small" style={{ marginTop: 8 }}>
          {GOAL_INFO[goal].hint}
        </p>
      </div>

      <div>
        <span className="label">Powstaną plany</span>
        <ul className="list">
          {result.plans.map((p) => {
            const weekday = result.schedule.indexOf(p.id);
            return (
              <li key={p.id}>
                <div className="item" style={{ minHeight: 52 }}>
                  <span className="item-main">
                    <span className="item-title">{p.name}</span>
                    <span className="item-sub" style={{ display: 'block' }}>
                      {WEEKDAYS[weekday]} · {plural(p.items.length, 'ćwiczenie', 'ćwiczenia', 'ćwiczeń')}
                    </span>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <label className="item" style={{ minHeight: 0, padding: 0 }}>
        <span className="item-main muted small">Ustaw też harmonogram tygodnia według tych dni (zastąpi obecny).</span>
        <input type="checkbox" className="switch" checked={schedule} onChange={(e) => setSchedule(e.target.checked)} />
      </label>

      <button
        type="button"
        className="btn btn-primary btn-block"
        onClick={() => {
          result.plans.forEach(store.savePlan);
          if (schedule) store.saveSettings({ ...store.settings, schedule: result.schedule });
          onDone();
        }}
      >
        Utwórz {plural(result.plans.length, 'plan', 'plany', 'planów')}
      </button>
    </div>
  );
}
