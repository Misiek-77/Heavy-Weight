import { describe, expect, it } from 'vitest';
import { SEED_EXERCISES, seedUpdates } from './seed';

const find = (id: string) => SEED_EXERCISES.find((e) => e.id === id)!;

describe('bringing an older install up to date', () => {
  it('adds built-in exercises that are missing', () => {
    const old = SEED_EXERCISES.filter((e) => e.id !== 'seed-side-plank' && e.id !== 'seed-db-pullover');
    expect(seedUpdates(old).map((e) => e.id).sort()).toEqual(['seed-db-pullover', 'seed-side-plank']);
  });

  it('renames an exercise still under its old name, keeping everything else about it', () => {
    const row = { ...find('seed-barbell-row'), name: 'Wiosłowanie sztangą w opadzie', restSeconds: 120 };
    const others = SEED_EXERCISES.filter((e) => e.id !== row.id);
    expect(seedUpdates([...others, row])).toEqual([{ ...row, name: 'Wiosłowanie sztangą w opadzie nachwytem' }]);
  });

  it('changes nothing on an up-to-date install or for archived and edited exercises', () => {
    expect(seedUpdates(SEED_EXERCISES)).toEqual([]);
    const archived = SEED_EXERCISES.map((e) => (e.id === 'seed-squat' ? { ...e, archived: true } : e));
    expect(seedUpdates(archived)).toEqual([]);
  });

  it('marks the side plank as held for time', () => {
    expect(find('seed-side-plank').timed).toBe(true);
  });
});
