import { describe, it, expect } from 'vitest';
import { generateKeyBetween, generateNKeysBetween } from './fractional-index.js';

describe('generateKeyBetween', () => {
  it('generates initial key when both bounds are null', () => {
    const key = generateKeyBetween(null, null);
    expect(key).toBe('a0');
  });

  it('generates a key after an existing key', () => {
    const key = generateKeyBetween('a0', null);
    expect(key).toBe('a1');
  });

  it('generates a key before an existing key', () => {
    const key = generateKeyBetween(null, 'a0');
    expect(key).toBe('Za');
    expect(key < 'a0').toBe(true);
  });

  it('generates a key between two existing keys', () => {
    const key = generateKeyBetween('a0', 'a1');
    expect(key).toBe('a0V');
  });

  it('generates keys in lexicographic order', () => {
    const a = generateKeyBetween(null, null);
    const b = generateKeyBetween(a, null);
    const c = generateKeyBetween(b, null);
    expect(a < b).toBe(true);
    expect(b < c).toBe(true);
  });

  it('generates a key between two adjacent keys', () => {
    const a = 'a0';
    const b = 'a1';
    const mid = generateKeyBetween(a, b);
    expect(a < mid).toBe(true);
    expect(mid < b).toBe(true);
  });

  it('supports many insertions at the end', () => {
    let key = generateKeyBetween(null, null);
    const keys = [key];
    for (let i = 0; i < 100; i++) {
      key = generateKeyBetween(key, null);
      keys.push(key);
    }
    // Verify all keys are strictly ordered
    for (let i = 1; i < keys.length; i++) {
      expect(keys[i - 1] < keys[i]).toBe(true);
    }
  });

  it('supports many insertions at the beginning', () => {
    let key = generateKeyBetween(null, null);
    const keys = [key];
    for (let i = 0; i < 100; i++) {
      key = generateKeyBetween(null, key);
      keys.unshift(key);
    }
    for (let i = 1; i < keys.length; i++) {
      expect(keys[i - 1] < keys[i]).toBe(true);
    }
  });

  it('supports many insertions between the same two keys', () => {
    const a = 'a0';
    const b = 'a1';
    let prev = a;
    const keys = [];
    for (let i = 0; i < 20; i++) {
      const key = generateKeyBetween(prev, b);
      expect(prev < key).toBe(true);
      expect(key < b).toBe(true);
      keys.push(key);
      prev = key;
    }
  });

  it('throws when a >= b', () => {
    expect(() => generateKeyBetween('a1', 'a0')).toThrow();
    expect(() => generateKeyBetween('a0', 'a0')).toThrow();
  });
});

describe('generateNKeysBetween', () => {
  it('returns empty array for n=0', () => {
    expect(generateNKeysBetween(null, null, 0)).toEqual([]);
  });

  it('returns single key for n=1', () => {
    const keys = generateNKeysBetween(null, null, 1);
    expect(keys).toHaveLength(1);
    expect(keys[0]).toBe('a0');
  });

  it('generates n ordered keys', () => {
    const keys = generateNKeysBetween(null, null, 5);
    expect(keys).toHaveLength(5);
    for (let i = 1; i < keys.length; i++) {
      expect(keys[i - 1] < keys[i]).toBe(true);
    }
  });

  it('generates keys between two bounds', () => {
    const a = 'a0';
    const b = 'a5';
    const keys = generateNKeysBetween(a, b, 3);
    expect(keys).toHaveLength(3);
    expect(a < keys[0]).toBe(true);
    expect(keys[keys.length - 1] < b).toBe(true);
    for (let i = 1; i < keys.length; i++) {
      expect(keys[i - 1] < keys[i]).toBe(true);
    }
  });

  it('generates keys after a bound', () => {
    const keys = generateNKeysBetween('a0', null, 3);
    expect(keys).toHaveLength(3);
    expect('a0' < keys[0]).toBe(true);
    for (let i = 1; i < keys.length; i++) {
      expect(keys[i - 1] < keys[i]).toBe(true);
    }
  });

  it('generates keys before a bound', () => {
    const keys = generateNKeysBetween(null, 'a0', 3);
    expect(keys).toHaveLength(3);
    expect(keys[keys.length - 1] < 'a0').toBe(true);
    for (let i = 1; i < keys.length; i++) {
      expect(keys[i - 1] < keys[i]).toBe(true);
    }
  });
});
