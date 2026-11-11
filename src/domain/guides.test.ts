import { describe, expect, it } from 'vitest';
import { guideFor } from './guides';
import { SEED_EXERCISES } from './seed';

describe('exercise guides', () => {
  it.each(SEED_EXERCISES.map((e) => [e.name, e.id]))('%s has a complete guide', (_name, id) => {
    const guide = guideFor(id);
    expect(guide).toBeDefined();
    expect(guide!.primary.length).toBeGreaterThan(0);
    expect(guide!.steps.length).toBeGreaterThanOrEqual(3);
    expect(guide!.mistakes.length).toBeGreaterThanOrEqual(2);
    for (const text of [...guide!.primary, ...guide!.secondary, ...guide!.steps, ...guide!.mistakes]) {
      expect(text.trim()).not.toBe('');
    }
  });

  it('has no guide for custom exercises', () => {
    expect(guideFor('7b0c1c1e-0000-4000-8000-000000000000')).toBeUndefined();
    expect(guideFor('seed-does-not-exist')).toBeUndefined();
  });
});
