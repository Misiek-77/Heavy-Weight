import { describe, expect, it } from 'vitest';
import { parseNumber } from './number';

describe('parseNumber', () => {
  it('accepts comma and dot decimals', () => {
    expect(parseNumber('62,5')).toBe(62.5);
    expect(parseNumber('62.5')).toBe(62.5);
    expect(parseNumber(' 100 ')).toBe(100);
    expect(parseNumber('0')).toBe(0);
  });
  it('rejects empty, negative and non-numeric input', () => {
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('-5')).toBeNull();
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber('12abc')).toBeNull();
    expect(parseNumber('1,2,3')).toBeNull();
  });
});
