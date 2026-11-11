import { describe, expect, it } from 'vitest';
import { guideFor } from './guides';
import { involvement, regionsOf } from './muscles';
import { SEED_EXERCISES } from './seed';

describe('muscle map', () => {
  it('maps every muscle named in a guide to at least one region', () => {
    const unmapped = new Set<string>();
    for (const exercise of SEED_EXERCISES) {
      const guide = guideFor(exercise.id)!;
      for (const muscle of [...guide.primary, ...guide.secondary]) {
        if (regionsOf(muscle).length === 0) unmapped.add(muscle);
      }
    }
    expect([...unmapped]).toEqual([]);
  });

  it('lights up at least one primary region for every built-in exercise', () => {
    for (const exercise of SEED_EXERCISES) {
      const levels = Object.values(involvement(guideFor(exercise.id)!));
      expect(levels, exercise.name).toContain('primary');
    }
  });

  it('marks regions by involvement and lets primary win over secondary', () => {
    expect(involvement({ primary: ['klatka piersiowa'], secondary: ['górna część klatki', 'triceps'] })).toEqual({
      chestUpper: 'primary',
      chestLower: 'primary',
      triceps: 'secondary',
    });
  });

  it('ignores muscle names it does not know', () => {
    expect(regionsOf('nieznany')).toEqual([]);
    expect(involvement({ primary: ['nieznany'], secondary: [] })).toEqual({});
  });
});
