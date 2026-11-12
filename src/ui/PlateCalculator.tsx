import { useState } from 'react';
import { BAR_WEIGHTS, plateLoad } from '../domain/plates';
import { formatWeight } from './format';
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
  const [target, setTarget] = useState(initialWeight);
  const [bar, setBar] = useState<number>(BAR_WEIGHTS[0]);
  const load = plateLoad(target, bar);

  return (
    <div className="stack">
      <label className="field">
        <span>Ciężar na sztandze (kg)</span>
        <NumberField label="Ciężar na sztandze w kg" value={target} onChange={setTarget} />
      </label>
      <div>
        <span className="label">Sztanga</span>
        <div className="chips" role="group" aria-label="Waga sztangi" style={{ marginTop: 8 }}>
          {BAR_WEIGHTS.map((w) => (
            <button key={w} type="button" className="chip" aria-pressed={bar === w} onClick={() => setBar(w)}>
              {w} kg
            </button>
          ))}
        </div>
      </div>

      <div role="status">
        <span className="label">Na każdą stronę</span>
        {load.perSide.length > 0 ? (
          <ul className="plates">
            {load.perSide.map((plate, i) => (
              <li key={i} className="plate" style={{ '--size': plate } as React.CSSProperties}>
                {formatWeight(plate)}
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
            Razem {formatWeight(load.loaded)} kg ze sztangą {bar} kg.
            {load.missing > 0 && ` Brakuje ${formatWeight(load.missing)} kg — standardowymi talerzami nie da się tego złożyć.`}
          </p>
        )}
      </div>
    </div>
  );
}
