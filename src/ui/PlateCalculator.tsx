import { useState } from 'react';
import { BAR_WEIGHTS, BAR_WEIGHTS_LB, STANDARD_PLATES, STANDARD_PLATES_LB, plateLoad } from '../domain/plates';
import { displayWeight, formatNumber, weightUnit } from './format';
import { NumberField } from './NumberField';
import { Sheet } from './Sheet';

/** Bottom sheet that says which plates to put on each side of the bar for a target weight. */
export function PlateCalculator({ open, onClose, initialWeight }: { open: boolean; onClose(): void; initialWeight: number }) {
  return (
    <Sheet open={open} onClose={onClose} title="Kalkulator talerzy">
      {open && <Calculator initialWeight={initialWeight} />}
    </Sheet>
  );
}

function Calculator({ initialWeight }: { initialWeight: number }) {
  // The calculator works in the display unit throughout: pounds use pound plates and bars.
  const unit = weightUnit();
  const bars = unit === 'lb' ? BAR_WEIGHTS_LB : BAR_WEIGHTS;
  const [target, setTarget] = useState(() => displayWeight(initialWeight));
  const [bar, setBar] = useState<number>(bars[0]);
  const load = plateLoad(target, bar, unit === 'lb' ? STANDARD_PLATES_LB : STANDARD_PLATES);

  return (
    <div className="stack">
      <label className="field">
        <span>Ciężar na sztandze ({unit})</span>
        <NumberField label={`Ciężar na sztandze w ${unit}`} value={target} onChange={setTarget} />
      </label>
      <div>
        <span className="label">Sztanga</span>
        <div className="chips" role="group" aria-label="Waga sztangi" style={{ marginTop: 8 }}>
          {bars.map((w) => (
            <button key={w} type="button" className="chip" aria-pressed={bar === w} onClick={() => setBar(w)}>
              {w} {unit}
            </button>
          ))}
        </div>
      </div>

      <div role="status">
        <span className="label">Na każdą stronę</span>
        {load.perSide.length > 0 ? (
          <ul className="plates">
            {load.perSide.map((plate, i) => (
              <li key={i} className="plate" style={{ '--size': unit === 'lb' ? plate / 2 : plate } as React.CSSProperties}>
                {formatNumber(plate)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted" style={{ marginTop: 8 }}>
            {target <= 0 ? 'Wpisz ciężar.' : target < bar ? 'To mniej niż sama sztanga.' : 'Sama sztanga, bez talerzy.'}
          </p>
        )}
        {load.perSide.length > 0 && (
          <p className="muted small" style={{ marginTop: 10 }}>
            Razem {formatNumber(load.loaded)} {unit} ze sztangą {bar} {unit}.
            {load.missing > 0 && ` Brakuje ${formatNumber(load.missing)} ${unit} — standardowymi talerzami nie da się tego złożyć.`}
          </p>
        )}
      </div>
    </div>
  );
}
