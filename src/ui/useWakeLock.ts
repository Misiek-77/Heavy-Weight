import { useEffect } from 'react';

/**
 * Keeps the screen on while `active`, where the browser supports it. The lock is dropped by the
 * browser whenever the page is hidden, so it is taken again each time the page comes back.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const next = await navigator.wakeLock.request('screen');
        if (cancelled) void next.release();
        else lock = next;
      } catch {
        // Refused (battery saver, permissions): the workout simply goes on without it.
      }
    };
    void acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', acquire);
      void lock?.release();
    };
  }, [active]);
}
