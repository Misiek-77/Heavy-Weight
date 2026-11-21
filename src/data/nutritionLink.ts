import { useEffect, useState } from 'react';
import { readDatabase } from './otherApp';

export interface WeightReading {
  date: string;
  kg: number;
  updatedAt: string;
}

/** Body weight logged in Jadłospis on this device, read again whenever the app comes back to the foreground. */
export function useNutritionWeights(): WeightReading[] {
  const [weights, setWeights] = useState<WeightReading[]>([]);
  useEffect(() => {
    let alive = true;
    const load = () =>
      void readDatabase('jadlospis').then((db) => {
        if (!alive || !db) return;
        const list: WeightReading[] = [];
        for (const w of (db.weights ?? []) as Partial<WeightReading>[]) {
          if (typeof w.date === 'string' && typeof w.kg === 'number' && w.kg > 0) list.push({ date: w.date, kg: w.kg, updatedAt: w.updatedAt ?? '' });
        }
        setWeights(list);
      });
    load();
    const onShow = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onShow);
    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', onShow);
    };
  }, []);
  return weights;
}
