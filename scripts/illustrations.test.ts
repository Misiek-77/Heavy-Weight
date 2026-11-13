import { existsSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { POSES } from './illustration-poses.mjs';
import { SEED_EXERCISES } from '../src/domain/seed';
import { ANIMATED, ILLUSTRATED } from '../src/ui/illustrated';

const seedKeys = SEED_EXERCISES.map((e) => e.id.slice('seed-'.length)).sort();

describe('exercise illustrations', () => {
  it('lists exactly the images present in public/exercises', () => {
    const files = readdirSync('public/exercises')
      .filter((f) => f.endsWith('.jpg'))
      .map((f) => f.slice(0, -4))
      .sort();
    // If this fails, run: npm run illustrations -- --manifest
    expect([...ILLUSTRATED].sort()).toEqual(files);
  });

  it('lists exactly the animation strips present in public/exercises/frames', () => {
    const dir = 'public/exercises/frames';
    const files = (existsSync(dir) ? readdirSync(dir) : [])
      .filter((f) => f.endsWith('.jpg'))
      .map((f) => f.slice(0, -4))
      .sort();
    // If this fails, run: npm run illustrations -- --manifest
    expect([...ANIMATED].sort()).toEqual(files);
  });

  it('has a pose description for every built-in exercise and nothing else', () => {
    expect(Object.keys(POSES).sort()).toEqual(seedKeys);
  });
});
