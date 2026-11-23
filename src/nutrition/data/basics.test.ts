import { describe, expect, it } from 'vitest';
import { kcalFromMacros } from '../domain/nutrients';
import { BASIC_FOODS } from './basics';

describe('the built-in list of common foods', () => {
  it('has unique names', () => {
    const names = BASIC_FOODS.map((f) => f.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('has energy that agrees with the macros (alcohol aside), so no row is mistyped', () => {
    const off = BASIC_FOODS.filter((f) => !/Piwo|Wino|Kawa czarna/.test(f.name)).filter((f) => {
      const fromMacros = kcalFromMacros(f.per100);
      return Math.abs(fromMacros - f.per100.kcal) > Math.max(15, f.per100.kcal * 0.15);
    });
    expect(off.map((f) => `${f.name}: ${f.per100.kcal} vs ${Math.round(kcalFromMacros(f.per100))}`)).toEqual([]);
  });
});
