import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PERIOD_KINDS, periodAt, summarizePeriod, type Period, type PeriodKind, type PeriodSummary } from '../domain/periods';
import { useStore } from '../state/store';
import { Header } from '../ui/Chrome';
import { ExerciseThumb } from '../ui/ExerciseThumb';
import { capitalize, formatDay, formatDuration, formatNumber, formatVolume, formatWeight, formatWhole, plural, weightUnit } from '../ui/format';
import { Icon } from '../ui/Icon';
import { useToday } from '../ui/useToday';

const KIND_LABEL: Record<PeriodKind, string> = { week: 'Tydzień', month: 'Miesiąc', year: 'Rok' };
const PREVIOUS_LABEL: Record<PeriodKind, string> = { week: 'poprzedni tydzień', month: 'poprzedni miesiąc', year: 'poprzedni rok' };
const CURRENT_LABEL: Record<PeriodKind, string> = { week: 'Ten tydzień', month: 'Ten miesiąc', year: 'Ten rok' };

const dayMonth = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short' });
const monthYear = new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' });

/** "16–22 lis 2026", "Listopad 2026" or "2026". */
function periodTitle(p: Period): string {
  if (p.kind === 'year') return String(p.from.getFullYear());
  if (p.kind === 'month') return capitalize(monthYear.format(p.from));
  const last = new Date(p.to.getFullYear(), p.to.getMonth(), p.to.getDate() - 1);
  return `${dayMonth.format(p.from)} – ${dayMonth.format(last)} ${last.getFullYear()}`;
}

/** Week, month or year at a glance, with the change against the period before. */
export function SummaryScreen() {
  const store = useStore();
  const now = useToday();
  const [kind, setKind] = useState<PeriodKind>('week');
  const [offset, setOffset] = useState(0);
  const period = periodAt(kind, now, offset);
  const before = periodAt(kind, now, offset - 1);
  const summary = useMemo(() => summarizePeriod(store.workouts, store.exercises, period), [store.workouts, store.exercises, period.from.getTime(), kind]); // eslint-disable-line react-hooks/exhaustive-deps
  const previous = useMemo(() => summarizePeriod(store.workouts, store.exercises, before), [store.workouts, store.exercises, before.from.getTime(), kind]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="screen">
      <Header back="/postepy" />
      <h1 className="title">Podsumowanie</h1>

      <div className="segmented" role="group" aria-label="Okres podsumowania" style={{ marginTop: 16 }}>
        {PERIOD_KINDS.map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => {
              setKind(k);
              setOffset(0);
            }}
          >
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>

      <div className="period-nav">
        <button type="button" className="icon-btn" aria-label="Poprzedni okres" onClick={() => setOffset(offset - 1)}>
          <Icon name="back" />
        </button>
        <div className="period-title">
          <strong>{periodTitle(period)}</strong>
          {offset === 0 && <span className="muted small">{CURRENT_LABEL[kind]}</span>}
        </div>
        <button type="button" className="icon-btn" aria-label="Następny okres" disabled={offset >= 0} onClick={() => setOffset(offset + 1)}>
          <Icon name="forward" />
        </button>
      </div>

      <section className={`summary-hero summary-hero-${kind}`}>
        <img
          className="summary-art"
          src={`${import.meta.env.BASE_URL}summary/${kind}.jpg`}
          alt=""
          width={960}
          height={540}
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
        <div className="summary-hero-text">
          <span className="summary-big">{summary.workouts}</span>
          <span className="summary-big-label">{plural(summary.workouts, 'trening', 'treningi', 'treningów').replace(/^\d+ /, '')}</span>
          <Delta now={summary.workouts} before={previous.workouts} against={PREVIOUS_LABEL[kind]} />
        </div>
      </section>

      {summary.workouts === 0 ? (
        <p className="empty">W tym okresie nie ma zakończonych treningów.</p>
      ) : (
        <>
          <section className="section summary-grid" aria-label="Liczby">
            <Tile label="Dni treningowe" value={formatWhole(summary.days)} now={summary.days} before={previous.days} />
            <Tile label="Czas" value={formatDuration(summary.duration)} now={summary.duration} before={previous.duration} />
            <Tile label={`Objętość (${weightUnit()})`} value={formatVolume(summary.volume)} now={summary.volume} before={previous.volume} />
            <Tile label="Serie robocze" value={formatWhole(summary.sets)} now={summary.sets} before={previous.sets} />
            <Tile label="Powtórzenia" value={formatWhole(summary.reps)} now={summary.reps} before={previous.reps} />
            <Tile label="Średni trening" value={formatDuration(summary.duration / summary.workouts)} />
          </section>

          <MuscleShare summary={summary} />

          <section className="section">
            <h2 className="label">Najczęściej robione</h2>
            <ol className="list">
              {summary.topExercises.map((t, i) => (
                <li key={t.exerciseId}>
                  <Link className="item" to={`/cwiczenia/${t.exerciseId}`}>
                    <span className="rank" aria-hidden="true">
                      {i + 1}
                    </span>
                    <ExerciseThumb exerciseId={t.exerciseId} />
                    <span className="item-main">
                      <span className="item-title">{store.exerciseName(t.exerciseId)}</span>
                      <span className="item-sub">{plural(t.sets, 'seria', 'serie', 'serii')}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <section className="section">
            <h2 className="label">Pobite rekordy</h2>
            {summary.records.length === 0 ? (
              <p className="empty">W tym okresie bez nowych rekordów.</p>
            ) : (
              <ul className="list">
                {summary.records.map((r) => {
                  const timed = store.timedIds.has(r.exerciseId);
                  const show = (v: number) => (timed ? `${formatNumber(v)} s` : `${formatWeight(v)} ${weightUnit()}`);
                  return (
                    <li key={`${r.workoutId}-${r.exerciseId}`}>
                      <Link className="item" to={`/historia/${r.workoutId}`}>
                        <span className="item-main">
                          <span className="item-title">{store.exerciseName(r.exerciseId)}</span>
                          <span className="item-sub">
                            {formatDay(r.date)} · {show(r.previous)} → {show(r.value)}
                          </span>
                        </span>
                        <span className="badge">Rekord</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}

/** "+2 vs poprzedni tydzień", "−10%"… or nothing when there is nothing to compare with. */
function Delta({ now, before, against }: { now: number; before: number; against?: string }) {
  if (before === 0 && now === 0) return null;
  if (before === 0) return <span className="delta up">nowość{against ? ` · ${against} bez treningów` : ''}</span>;
  const change = Math.round(((now - before) / before) * 100);
  const text = change === 0 ? 'bez zmian' : `${change > 0 ? '+' : '−'}${Math.abs(change)}%`;
  return (
    <span className={change > 0 ? 'delta up' : change < 0 ? 'delta down' : 'delta'}>
      {text}
      {against ? ` vs ${against}` : ''}
    </span>
  );
}

function Tile({ label, value, now, before }: { label: string; value: string; now?: number; before?: number }) {
  return (
    <div className="summary-tile">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {now !== undefined && before !== undefined && <Delta now={now} before={before} />}
    </div>
  );
}

/** Share of working sets per muscle group, as one stacked bar and a legend. */
function MuscleShare({ summary }: { summary: PeriodSummary }) {
  const groups = summary.setsByGroup.filter((g) => g.sets > 0).sort((a, b) => b.sets - a.sets);
  const total = groups.reduce((n, g) => n + g.sets, 0);
  if (total === 0) return null;
  return (
    <section className="section">
      <h2 className="label">Partie mięśni</h2>
      <ul className="bars">
        {groups.map((g) => (
          <li key={g.group} className="bar-row">
            <span className="bar-name">{capitalize(g.group)}</span>
            <span className="bar-track" aria-hidden="true">
              <span className="bar-fill" style={{ width: `${(g.sets / groups[0].sets) * 100}%` }} />
            </span>
            <span className="bar-value">
              {plural(g.sets, 'seria', 'serie', 'serii')} · {Math.round((g.sets / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
