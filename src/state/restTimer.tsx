import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export interface RestTimer {
  /** Whole seconds left, or null when no rest is running. */
  remaining: number | null;
  /** Length of the current rest in seconds, including any added time. */
  total: number;
  /** Starts a rest; with `sound` a short signal plays when it runs out. */
  start(seconds: number, sound?: boolean): void;
  add(deltaSeconds: number): void;
  stop(): void;
}

const RestTimerContext = createContext<RestTimer | null>(null);

export function useRestTimer(): RestTimer {
  const timer = useContext(RestTimerContext);
  if (!timer) throw new Error('useRestTimer must be used inside <RestTimerProvider>');
  return timer;
}

/** Two short beeps. Needs an AudioContext unlocked by an earlier tap, which starting a rest provides. */
function beep(audio: AudioContext) {
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
        setNow(t);
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

  const value = useMemo<RestTimer>(
    () => ({
      remaining: rest ? Math.max(0, Math.ceil((rest.endsAt - now) / 1000)) : null,
      total: rest?.total ?? 0,
      start,
      add,
      stop,
    }),
    [rest, now, start, add, stop],
  );

  return <RestTimerContext.Provider value={value}>{children}</RestTimerContext.Provider>;
}
