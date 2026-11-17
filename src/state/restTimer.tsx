import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

/** What starts and changes a rest. Stable for the life of the app, so using it never causes a redraw. */
export interface RestControls {
  /** Starts a rest; with `sound` a short signal plays when it runs out. */
  start(seconds: number, sound?: boolean): void;
  add(deltaSeconds: number): void;
  stop(): void;
}

export interface RestTimer extends RestControls {
  /** Whole seconds left, or null when no rest is running. */
  remaining: number | null;
  /** Length of the current rest in seconds, including any added time. */
  total: number;
}

// Three contexts, so a component redraws only as often as the part it reads changes: the countdown every
// second, whether a rest is running only when one starts or ends, the controls never.
const ControlsContext = createContext<RestControls | null>(null);
const RestingContext = createContext(false);
const CountdownContext = createContext<{ remaining: number | null; total: number }>({ remaining: null, total: 0 });

export function useRestControls(): RestControls {
  const controls = useContext(ControlsContext);
  if (!controls) throw new Error('useRestControls must be used inside <RestTimerProvider>');
  return controls;
}

/** Whether a rest is running. */
export const useResting = () => useContext(RestingContext);

/** The countdown and the controls. Redraws every second while a rest runs, so keep it to small components. */
export function useRestTimer(): RestTimer {
  return { ...useRestControls(), ...useContext(CountdownContext) };
}

/** Two short beeps. Needs an AudioContext unlocked by an earlier tap, which starting a rest provides. */
function beep(audio: AudioContext) {
  // Browsers suspend an idle context; scheduling on a suspended one plays nothing.
  void audio.resume();
  for (const at of [0, 0.22]) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = 880;
    const t = audio.currentTime + at;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + 0.18);
  }
}

export function RestTimerProvider({ children }: { children: ReactNode }) {
  // Based on an end timestamp, so the countdown stays right when the tab sleeps in the background.
  const [rest, setRest] = useState<{ endsAt: number; total: number; sound: boolean } | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!rest) return;
    const tick = () => {
      const t = Date.now();
      if (t >= rest.endsAt) {
        setRest(null);
        navigator.vibrate?.([200, 100, 200]);
        if (rest.sound && audio.current) beep(audio.current);
      } else {
        // Only when the shown second changes, so the countdown redraws once a second rather than on every tick.
        setNow((prev) => (Math.ceil((rest.endsAt - prev) / 1000) === Math.ceil((rest.endsAt - t) / 1000) ? prev : t));
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [rest]);

  const start = useCallback((seconds: number, sound = false) => {
    if (sound) {
      // Created and resumed inside the tap that starts the rest; browsers block audio otherwise.
      try {
        audio.current ??= new AudioContext();
        void audio.current.resume();
      } catch {
        audio.current = null;
      }
    }
    setNow(Date.now());
    setRest({ endsAt: Date.now() + seconds * 1000, total: seconds, sound });
  }, []);
  const add = useCallback((delta: number) => {
    setRest((r) => r && { ...r, endsAt: r.endsAt + delta * 1000, total: Math.max(1, r.total + delta) });
  }, []);
  const stop = useCallback(() => setRest(null), []);

  const controls = useMemo<RestControls>(() => ({ start, add, stop }), [start, add, stop]);
  const remaining = rest ? Math.max(0, Math.ceil((rest.endsAt - now) / 1000)) : null;
  const total = rest?.total ?? 0;
  const countdown = useMemo(() => ({ remaining, total }), [remaining, total]);

  return (
    <ControlsContext.Provider value={controls}>
      <RestingContext.Provider value={rest !== null}>
        <CountdownContext.Provider value={countdown}>{children}</CountdownContext.Provider>
      </RestingContext.Provider>
    </ControlsContext.Provider>
  );
}
