import { useEffect, useRef, useState } from 'react';
import { INTERVAL_MODES, INTERVAL_PRESETS, phaseAt, totalSeconds, type IntervalMode, type IntervalPlan, type PhaseKind } from '../domain/intervals';
import { beep } from '../state/restTimer';
import { Header } from '../ui/Chrome';
import { formatClock } from '../ui/format';
import { Icon } from '../ui/Icon';
import { NumberField } from '../ui/NumberField';
import { useWakeLock } from '../ui/useWakeLock';

const MODE_LABEL: Record<IntervalMode, string> = { emom: 'EMOM', tabata: 'Tabata', custom: 'Własny' };
const MODE_HINT: Record<IntervalMode, string> = {
  emom: 'Co minutę zaczynasz serię, a resztę minuty odpoczywasz.',
  tabata: '20 s wysiłku, 10 s przerwy, 8 rund.',
  custom: 'Na przykład deska: 45 s, przerwa 15 s, 4 rundy.',
};
const PHASE_LABEL: Record<PhaseKind, string> = { prep: 'Przygotuj się', work: 'Praca', rest: 'Przerwa', done: 'Koniec' };

/** Remembered between visits on this device only; a convenience, so failures are ignored. */
const STORAGE_KEY = 'interval-timer';
function loadSaved(): { mode: IntervalMode; custom: IntervalPlan } {
  const fallback = { mode: 'tabata' as IntervalMode, custom: { workSeconds: 45, restSeconds: 15, rounds: 4 } };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (saved && INTERVAL_MODES.includes(saved.mode) && saved.custom?.workSeconds > 0 && saved.custom?.rounds > 0) return saved;
  } catch {
    // Private mode or blocked storage.
  }
  return fallback;
}

/** Countdown for timed intervals (EMOM, Tabata, own work and rest), with beeps and vibration between phases. */
export function IntervalTimerScreen() {
  const [saved] = useState(loadSaved);
  const [mode, setMode] = useState<IntervalMode>(saved.mode);
  const [custom, setCustom] = useState<IntervalPlan>(saved.custom);
  const [emomRounds, setEmomRounds] = useState(INTERVAL_PRESETS.emom.rounds);
  const plan: IntervalPlan = mode === 'custom' ? custom : mode === 'emom' ? { ...INTERVAL_PRESETS.emom, rounds: emomRounds } : INTERVAL_PRESETS.tabata;
  const valid = plan.workSeconds > 0 && plan.rounds > 0;

  // Time is measured from timestamps, so the count stays right even when the phone throttles the page.
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const audio = useRef<AudioContext | null>(null);
  const running = startedAt !== null && pausedAt === null;
  const elapsed = startedAt === null ? 0 : ((pausedAt ?? now) - startedAt) / 1000;
  const phase = phaseAt(plan, elapsed);
  const total = totalSeconds(plan);
  const lastSignal = useRef('');

  useWakeLock(running);

  // Browsers allow only a few sound contexts per page: close this one when leaving the screen.
  useEffect(() => () => void audio.current?.close().catch(() => undefined), []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [running]);

  // Signals: a long beep when a phase starts, short ticks over its last three seconds.
  useEffect(() => {
    if (!running || !audio.current) return;
    const key = `${phase.kind}-${phase.round}-${phase.remaining}`;
    if (key === lastSignal.current) return;
    lastSignal.current = key;
    if (phase.kind === 'done') {
      beep(audio.current, 3, 660);
      navigator.vibrate?.([300, 120, 300, 120, 300]);
      setPausedAt(Date.now());
    } else if (phase.remaining === phase.length && phase.kind !== 'prep') {
      beep(audio.current, phase.kind === 'work' ? 2 : 1, phase.kind === 'work' ? 990 : 660);
      navigator.vibrate?.(phase.kind === 'work' ? [250, 100, 250] : 250);
    } else if (phase.remaining <= 3 && phase.remaining > 0) {
      beep(audio.current, 1, 440);
    }
  }, [running, phase.kind, phase.round, phase.remaining, phase.length]);

  function start() {
    // The sound needs a tap to be allowed; this one is it.
    audio.current ??= new AudioContext();
    void audio.current.resume();
    const t = Date.now();
    if (startedAt === null || phase.kind === 'done') {
      lastSignal.current = '';
      setStartedAt(t);
    } else if (pausedAt !== null) {
      setStartedAt(startedAt + (t - pausedAt));
    }
    setPausedAt(null);
    setNow(t);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, custom }));
    } catch {
      // Not remembered; nothing else depends on it.
    }
  }

  function reset() {
    setStartedAt(null);
    setPausedAt(null);
  }

  const idle = startedAt === null;
  const share = phase.length > 0 ? 1 - phase.remaining / phase.length : 1;

  return (
    <main className="screen">
      <Header back="/" />
      <h1 className="title">Minutnik interwałowy</h1>

      {idle ? (
        <section className="section stack">
          <div className="segmented" role="group" aria-label="Rodzaj">
            {INTERVAL_MODES.map((m) => (
              <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}>
                {MODE_LABEL[m]}
              </button>
            ))}
          </div>
          <p className="muted small">{MODE_HINT[mode]}</p>
          {mode === 'emom' && (
            <label className="field">
              <span>Liczba minut</span>
              <NumberField integer label="Liczba minut" value={emomRounds} onChange={setEmomRounds} />
            </label>
          )}
          {mode === 'custom' && (
            <div className="measure-grid">
              <label className="field">
                <span>Praca (s)</span>
                <NumberField integer label="Czas pracy w sekundach" value={custom.workSeconds} onChange={(workSeconds) => setCustom({ ...custom, workSeconds })} />
              </label>
              <label className="field">
                <span>Przerwa (s)</span>
                <NumberField integer label="Czas przerwy w sekundach" value={custom.restSeconds} onChange={(restSeconds) => setCustom({ ...custom, restSeconds })} />
              </label>
              <label className="field">
                <span>Rundy</span>
                <NumberField integer label="Liczba rund" value={custom.rounds} onChange={(rounds) => setCustom({ ...custom, rounds })} />
              </label>
            </div>
          )}
          <p className="muted small">Razem {formatClock(Math.round(total))}, z 10 s na przygotowanie.</p>
          <button type="button" className="btn btn-primary btn-block" disabled={!valid} onClick={start}>
            <Icon name="play" />
            Start
          </button>
        </section>
      ) : (
        <section className={`section interval interval-${phase.kind}`} role="timer" aria-live="off">
          <p className="interval-phase">{PHASE_LABEL[phase.kind]}</p>
          <p className="interval-clock">{formatClock(phase.remaining)}</p>
          <p className="interval-round">
            {phase.kind === 'prep' ? `${plan.rounds} rund przed Tobą` : `Runda ${phase.round} z ${plan.rounds}`}
          </p>
          <span className="bar-track interval-bar" aria-hidden="true">
            <span className="bar-fill" style={{ width: `${Math.min(100, share * 100)}%` }} />
          </span>
          <p className="muted small">Do końca: {formatClock(Math.max(0, Math.ceil(total - elapsed)))}</p>
          <div className="row-actions" style={{ marginTop: 16 }}>
            {phase.kind !== 'done' &&
              (running ? (
                <button type="button" className="btn" onClick={() => setPausedAt(Date.now())}>
                  <Icon name="pause" />
                  Pauza
                </button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={start}>
                  <Icon name="play" />
                  Wznów
                </button>
              ))}
            <button type="button" className="btn" onClick={reset}>
              {phase.kind === 'done' ? 'Gotowe' : 'Zakończ'}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
