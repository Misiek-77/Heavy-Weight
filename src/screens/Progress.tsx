import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { newId } from '../domain/id';
import { dayKey, monthGrid, muscleLoad, summarize, trainingDays } from '../domain/summary';
import { MEASURES, type Measure, type Measurement } from '../domain/types';
import { useStore } from '../state/store';
import { Header } from '../ui/Chrome';
import { GoalsSection } from './Goals';
import { displayWeight, formatDay, formatNumber, formatVolume, fromUnit, plural, toUnit, weightUnit } from '../ui/format';
import { Icon } from '../ui/Icon';
import { LineChart } from '../ui/LineChart';
import { MEASURE_INFO } from '../ui/measures';
import { NumberField } from '../ui/NumberField';
import { Confirm, Sheet } from '../ui/Sheet';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const monthTitle = new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' });
const WEEKDAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
/** How far back the muscle-group comparison looks. */
const LOAD_DAYS = 28;

export function ProgressScreen() {
  const store = useStore();
  // One "now" per visit keeps every section on the same day even around midnight.
  const now = useMemo(() => new Date(), []);
  const summary = useMemo(() => summarize(store.workouts, now, store.timedIds), [store.workouts, now, store.timedIds]);

  return (
    <main className="screen">
      <Header />
      <h1 className="title">Postępy</h1>
      <p className="subtitle">
        {summary.allTime.workouts === 0
          ? 'Zakończ pierwszy trening, a pojawią się tu liczby.'
          : `${plural(summary.allTime.workouts, 'trening', 'treningi', 'treningów')} łącznie · ${formatVolume(summary.allTime.volume)} ${weightUnit()}`}
      </p>

      <section className="section">
        <h2 className="label">Ten tydzień</h2>
        <div className="stats">
          <Stat value={summary.week.workouts} label="Treningi" />
          <Stat value={formatVolume(summary.week.volume)} unit={weightUnit()} label="Objętość" />
          <Stat value={summary.weekStreak} label={summary.weekStreak === 1 ? 'Tydzień z rzędu' : 'Tygodni z rzędu'} />
        </div>
      </section>

      <section className="section">
        <h2 className="label">Ten miesiąc</h2>
        <div className="stats">
          <Stat value={summary.month.workouts} label="Treningi" />
          <Stat value={formatVolume(summary.month.volume)} unit={weightUnit()} label="Objętość" />
          <span />
        </div>
      </section>

      <section className="section">
        <ul className="list">
          {[
            ['/postepy/rekordy', 'Rekordy', 'Najlepsze wyniki i historia ich bicia'],
            ['/postepy/porownanie', 'Porównanie miesięcy', 'Ten miesiąc obok poprzedniego'],
            ['/postepy/zdjecia', 'Zdjęcia sylwetki', 'Dwa zdjęcia obok siebie'],
          ].map(([to, title, sub]) => (
            <li key={to}>
              <Link className="item" to={to}>
                <span className="item-main">
                  <span className="item-title">{title}</span>
                  <span className="item-sub" style={{ display: 'block' }}>
                    {sub}
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

      <GoalsSection now={now} />
      <Calendar now={now} />
      <MuscleGroups now={now} />
      <BodyMeasurements now={now} />
    </main>
  );
}

function Stat({ value, unit, label }: { value: string | number; unit?: string; label: string }) {
  return (
    <div>
      <div className="stat-value">
        {value} {unit && <small>{unit}</small>}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function Calendar({ now }: { now: Date }) {
  const { workouts } = useStore();
  const [offset, setOffset] = useState(0);
  const days = useMemo(() => trainingDays(workouts), [workouts]);
  const { first, weeks } = monthGrid(now, offset);
  const today = dayKey(now);
  const count = weeks.flat().filter((d) => d.inMonth && days.has(d.key)).length;

  return (
    <section className="section">
      <div className="calendar-head">
        <h2 className="label">{capitalize(monthTitle.format(first))}</h2>
        <button type="button" className="icon-btn" aria-label="Poprzedni miesiąc" onClick={() => setOffset(offset - 1)}>
          <Icon name="back" />
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label="Następny miesiąc"
          disabled={offset >= 0}
          onClick={() => setOffset(offset + 1)}
        >
          <Icon name="forward" />
        </button>
      </div>
      <div
        className="calendar"
        role="img"
        aria-label={`Kalendarz: ${plural(count, 'dzień treningowy', 'dni treningowe', 'dni treningowych')} w tym miesiącu`}
      >
        {WEEKDAYS.map((d) => (
          <span key={d} className="calendar-weekday">
            {d}
          </span>
        ))}
        {weeks.flat().map((d) => {
          const classes = ['calendar-day'];
          if (!d.inMonth) classes.push('out');
          if (days.has(d.key)) classes.push('on');
          if (d.key === today) classes.push('today');
          return (
            <span key={d.key} className={classes.join(' ')}>
              {d.day}
            </span>
          );
        })}
      </div>
    </section>
  );
}

function MuscleGroups({ now }: { now: Date }) {
  const { workouts, exercises } = useStore();
  const load = useMemo(() => muscleLoad(workouts, exercises, now, LOAD_DAYS), [workouts, exercises, now]);
  // "Other" is only worth a row when something landed there.
  const rows = load.filter((l) => l.group !== 'inne' || l.sets > 0);
  const max = Math.max(1, ...rows.map((l) => l.sets));

  return (
    <section className="section">
      <h2 className="label">Partie mięśni · ostatnie 4 tygodnie</h2>
      <ul className="bars">
        {rows.map((l) => (
          <li key={l.group} className={l.sets === 0 ? 'bar-row empty-row' : 'bar-row'}>
            <span className="bar-name">{capitalize(l.group)}</span>
            <span className="bar-track" aria-hidden="true">
              <span className="bar-fill" style={{ width: `${(l.sets / max) * 100}%` }} />
            </span>
            <span className="bar-value">
              {l.sets === 0 ? 'brak serii' : `${plural(l.sets, 'seria', 'serie', 'serii')} · ${formatVolume(l.volume)} ${weightUnit()}`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function BodyMeasurements({ now }: { now: Date }) {
  const store = useStore();
  const [measure, setMeasure] = useState<Measure>('weight');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Measurement | null>(null);
  const sorted = useMemo(() => [...store.measurements].sort((a, b) => a.date.localeCompare(b.date)), [store.measurements]);
  const shown = (m: Measure, value: number) => (m === 'weight' ? toUnit(value) : value);
  const unitOf = (m: Measure) => (m === 'weight' ? weightUnit() : MEASURE_INFO[m].unit);
  const points = sorted
    .filter((m) => m.values[measure] !== undefined)
    .map((m) => ({ date: m.date, value: shown(measure, m.values[measure]!) }));
  const { label } = MEASURE_INFO[measure];
  const unit = unitOf(measure);
  const latest = points.at(-1);
  const change = latest && points.length > 1 ? latest.value - points[0].value : null;

  return (
    <section className="section">
      <h2 className="label">Pomiary ciała</h2>
      <div className="chips" role="group" aria-label="Pomiar">
        {MEASURES.map((m) => (
          <button key={m} type="button" className="chip" aria-pressed={measure === m} onClick={() => setMeasure(m)}>
            {MEASURE_INFO[m].label}
          </button>
        ))}
      </div>

      {latest ? (
        <>
          <div className="stats" style={{ marginTop: 16 }}>
            <Stat value={formatNumber(Math.round(latest.value * 10) / 10)} unit={unit} label={formatDay(latest.date)} />
            {change !== null ? (
              <Stat
                value={`${change > 0 ? '+' : change < 0 ? '−' : ''}${formatNumber(Math.round(Math.abs(change) * 10) / 10)}`}
                unit={unit}
                label={`Od ${formatDay(points[0].date)}`}
              />
            ) : (
              <span />
            )}
            <span />
          </div>
          {points.length > 1 && <LineChart points={points} unit={unit} />}
        </>
      ) : (
        <p className="empty">Brak pomiarów: {label.toLowerCase()}.</p>
      )}

      <button type="button" className="btn btn-block" style={{ marginTop: 16 }} onClick={() => setAdding(true)}>
        <Icon name="plus" />
        Dodaj pomiar
      </button>

      {sorted.length > 0 && (
        <ul className="list" style={{ marginTop: 8 }}>
          {[...sorted].reverse().map((m) => (
            <li key={m.id}>
              <div className="item">
                <span className="item-main">
                  <span className="item-title">{formatDay(m.date)}</span>
                  <span className="item-sub" style={{ display: 'block' }}>
                    {MEASURES.filter((k) => m.values[k] !== undefined)
                      .map((k) => `${MEASURE_INFO[k].label} ${formatNumber(Math.round(shown(k, m.values[k]!) * 10) / 10)} ${unitOf(k)}`)
                      .join(' · ')}
                  </span>
                </span>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Usuń pomiar z dnia ${formatDay(m.date)}`}
                  onClick={() => setRemoving(m)}
                >
                  <Icon name="trash" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={adding} onClose={() => setAdding(false)} title="Nowy pomiar">
        {adding && <MeasurementForm today={dayKey(now)} onDone={() => setAdding(false)} />}
      </Sheet>
      <Confirm
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && store.removeMeasurement(removing.id)}
        title="Usunąć pomiar?"
        message="Pomiar zniknie z listy i z wykresu. Tej operacji nie można cofnąć."
        confirmLabel="Usuń pomiar"
      />
    </section>
  );
}

function MeasurementForm({ today, onDone }: { today: string; onDone(): void }) {
  const store = useStore();
  const [date, setDate] = useState(today);
  // Opening the form on a day that already has an entry edits that entry instead of adding a second one.
  const existing = store.measurements.find((m) => m.date === date);
  const [values, setValues] = useState<Measurement['values']>(() => existing?.values ?? {});
  const filled = MEASURES.some((m) => (values[m] ?? 0) > 0);

  function changeDate(next: string) {
    setDate(next);
    setValues(store.measurements.find((m) => m.date === next)?.values ?? {});
  }

  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (!filled || !date) return;
        const kept = Object.fromEntries(MEASURES.filter((m) => (values[m] ?? 0) > 0).map((m) => [m, values[m]]));
        store.saveMeasurement({ id: existing?.id ?? newId(), date, values: kept, updatedAt: new Date().toISOString() });
        onDone();
      }}
    >
      <label className="field">
        <span>Data</span>
        <input className="input" type="date" value={date} max={today} required onChange={(e) => changeDate(e.target.value)} />
      </label>
      <div className="measure-grid">
        {MEASURES.map((m) => (
          <label className="field" key={m}>
            <span>
              {MEASURE_INFO[m].label} ({m === 'weight' ? weightUnit() : MEASURE_INFO[m].unit})
            </span>
            <NumberField
              label={`${MEASURE_INFO[m].label} w ${m === 'weight' ? weightUnit() : MEASURE_INFO[m].unit}`}
              value={m === 'weight' ? displayWeight(values[m] ?? 0) : (values[m] ?? 0)}
              onChange={(value) => setValues((v) => ({ ...v, [m]: m === 'weight' ? fromUnit(value) : value }))}
            />
          </label>
        ))}
      </div>
      <p className="muted small">Wpisz tylko to, co mierzysz. Puste pola zostaną pominięte.</p>
      <button type="submit" className="btn btn-primary btn-block" disabled={!filled || !date}>
        Zapisz pomiar
      </button>
    </form>
  );
}
