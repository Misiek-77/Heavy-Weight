import { useState } from 'react';
import { epley1RM, percentTable } from '../domain/stats';
import { displayWeight, formatWeight, fromUnit, weightStep, weightUnit } from './format';
import { NumberField } from './NumberField';

/**
 * Estimated one-rep max from any set, and the weights for common percentages of it. Starts from the
 * heaviest set logged for the exercise, so it opens on something useful.
 */
export function OneRepMax({ initial }: { initial?: { weight: number; reps: number } }) {
  // Typed in the display unit, kept in kilograms like everything else.
  const [weight, setWeight] = useState(() => initial?.weight ?? 0);
  const [reps, setReps] = useState(() => initial?.reps ?? 0);
  const max = reps > 0 && reps <= 15 ? epley1RM(weight, reps) : 0;
  const rows = percentTable(max, weightStep());

  return (
    <div className="stack">
      <div className="range" role="group" aria-label="Seria do przeliczenia">
        <NumberField label={`Ciężar w ${weightUnit()}`} value={displayWeight(weight)} onChange={(v) => setWeight(fromUnit(v))} />
        <span aria-hidden="true">×</span>
        <NumberField integer label="Powtórzenia" value={reps} onChange={setReps} />
        <span className="muted small">powt.</span>
      </div>
      {reps > 15 ? (
        <p className="muted small">Przy więcej niż 15 powtórzeniach szacunek jest zbyt niepewny. Wpisz cięższą serię.</p>
      ) : max > 0 ? (
        <>
          <p>
            Szacowane maksimum: <strong>{formatWeight(Math.round(max * 10) / 10)} {weightUnit()}</strong>
          </p>
          <table className="compare percent-table">
            <thead>
              <tr>
                <th scope="col">%</th>
                <th scope="col">Ciężar ({weightUnit()})</th>
                <th scope="col">Ok. powtórzeń</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.percent}>
                  <th scope="row">{r.percent}%</th>
                  <td>{formatWeight(r.weight)}</td>
                  <td>{r.reps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p className="muted small">Wpisz ciężar i liczbę powtórzeń jednej serii.</p>
      )}
    </div>
  );
}
