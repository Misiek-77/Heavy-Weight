import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface RestTimer {
  /** Whole seconds left, or null when no rest is running. */
  remaining: number | null;
  /** Length of the current rest in seconds, including any added time. */
  total: number;
  start(seconds: number): void;
  add(deltaSeconds: number): void;
  stop(): void;
}

const RestTimerContext = createContext<RestTimer | null>(null);

export function useRestTimer(): RestTimer {
  const timer = useContext(RestTimerContext);
  if (!timer) throw new Error('useRestTimer must be used inside <RestTimerProvider>');
  return timer;
}

export function RestTimerProvider({ children }: { children: ReactNode }) {
  // Based on an end timestamp, so the countdown stays right when the tab sleeps in the background.
  const [rest, setRest] = useState<{ endsAt: number; total: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!rest) return;
    const tick = () => {
      const t = Date.now();
      if (t >= rest.endsAt) {
        setRest(null);
        navigator.vibrate?.(200);
      } else {
        setNow(t);
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [rest]);

  const start = useCallback((seconds: number) => {
    setNow(Date.now());
    setRest({ endsAt: Date.now() + seconds * 1000, total: seconds });
  }, []);
  const add = useCallback((delta: number) => {
    setRest((r) => r && { endsAt: r.endsAt + delta * 1000, total: Math.max(1, r.total + delta) });
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
