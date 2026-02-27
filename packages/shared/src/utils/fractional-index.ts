/**
 * Fractional indexing for ordering items.
 *
 * Generates lexicographically ordered string keys that can be inserted
 * between any two existing keys without renumbering. Uses base-62 encoding
 * (digits 0-9, A-Z, a-z).
 *
 * Based on the algorithm described by David Greenspan:
 * https://observablehq.com/@dgreensp/implementing-fractional-indexing
 */

const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const BASE = DIGITS.length; // 62

const SMALLEST_INTEGER = 'A00000000000000000000000000';
const INTEGER_ZERO = 'a0';

function midpoint(a: string, b: string | undefined): string {
  if (b !== undefined && a >= b) {
    throw new Error(`${a} >= ${b}`);
  }
  if (a.slice(-1) === '0' || (b !== undefined && b.slice(-1) === '0')) {
    throw new Error('trailing zero');
  }

  if (b) {
    let n = 0;
    while ((a.charAt(n) || '0') === b.charAt(n)) {
      n++;
    }
    if (n > 0) {
      return b.slice(0, n) + midpoint(a.slice(n), b.slice(n));
    }
  }

  const digitA = a ? DIGITS.indexOf(a.charAt(0)) : 0;
  const digitB = b !== undefined ? DIGITS.indexOf(b.charAt(0)) : BASE;

  if (digitB - digitA > 1) {
    const midDigit = Math.round(0.5 * (digitA + digitB));
    return DIGITS.charAt(midDigit);
  } else {
    if (b !== undefined && b.length > 1) {
      return b.slice(0, 1);
    } else {
      return DIGITS.charAt(digitA) + midpoint(a.slice(1), undefined);
    }
  }
}

function validateInteger(int: string): void {
  if (int.length !== getIntegerLength(int.charAt(0))) {
    throw new Error('invalid integer part of order key: ' + int);
  }
}

function getIntegerLength(head: string): number {
  if (head >= 'a' && head <= 'z') {
    return head.charCodeAt(0) - 'a'.charCodeAt(0) + 2;
  } else if (head >= 'A' && head <= 'Z') {
    return 'Z'.charCodeAt(0) - head.charCodeAt(0) + 2;
  } else {
    throw new Error('invalid order key head: ' + head);
  }
}

function getIntegerPart(key: string): string {
  const integerPartLength = getIntegerLength(key.charAt(0));
  if (integerPartLength > key.length) {
    throw new Error('invalid order key: ' + key);
  }
  return key.slice(0, integerPartLength);
}

function validateOrderKey(key: string): void {
  if (key === SMALLEST_INTEGER) {
    throw new Error('invalid order key: ' + key);
  }
  const i = getIntegerPart(key);
  const f = key.slice(i.length);
  if (f.slice(-1) === '0') {
    throw new Error('invalid order key: ' + key);
  }
}

function incrementInteger(x: string): string | undefined {
  validateInteger(x);
  const [head, ...digs] = x.split('');
  let carry = true;
  for (let i = digs.length - 1; carry && i >= 0; i--) {
    const d = DIGITS.indexOf(digs[i]) + 1;
    if (d === BASE) {
      digs[i] = '0';
    } else {
      digs[i] = DIGITS.charAt(d);
      carry = false;
    }
  }
  if (carry) {
    if (head === 'Z') {
      return 'a' + head + digs.join('') + '0';
    }
    if (head === 'z') {
      return undefined; // overflow
    }
    const h = String.fromCharCode(head.charCodeAt(0) + 1);
    if (h > 'a') {
      return h + digs.join('') + '0';
    } else {
      digs.pop();
      return h + digs.join('');
    }
  } else {
    return head + digs.join('');
  }
}

function decrementInteger(x: string): string | undefined {
  validateInteger(x);
  const [head, ...digs] = x.split('');
  let borrow = true;
  for (let i = digs.length - 1; borrow && i >= 0; i--) {
    const d = DIGITS.indexOf(digs[i]) - 1;
    if (d === -1) {
      digs[i] = DIGITS.slice(-1);
    } else {
      digs[i] = DIGITS.charAt(d);
      borrow = false;
    }
  }
  if (borrow) {
    if (head === 'a') {
      return 'Z' + head + digs.join('').slice(0, -1);
    }
    if (head === 'A') {
      return undefined; // underflow
    }
    const h = String.fromCharCode(head.charCodeAt(0) - 1);
    if (h < 'Z') {
      return h + digs.join('') + DIGITS.slice(-1);
    } else {
      digs.push(DIGITS.slice(-1));
      return h + digs.join('');
    }
  } else {
    return head + digs.join('');
  }
}

/**
 * Generate a fractional index key between two existing keys.
 *
 * @param a - The key before the new position (null for start)
 * @param b - The key after the new position (null for end)
 * @returns A new key that sorts lexicographically between a and b
 */
export function generateKeyBetween(a: string | null, b: string | null): string {
  if (a !== null) validateOrderKey(a);
  if (b !== null) validateOrderKey(b);

  if (a !== null && b !== null && a >= b) {
    throw new Error(a + ' >= ' + b);
  }

  if (a === null) {
    if (b === null) {
      return INTEGER_ZERO;
    }
    const ib = getIntegerPart(b);
    const fb = b.slice(ib.length);
    if (ib === SMALLEST_INTEGER) {
      return ib + midpoint('', fb);
    }
    if (ib < b) {
      return ib;
    }
    const res = decrementInteger(ib);
    if (res === undefined) {
      throw new Error('cannot decrement any more');
    }
    return res;
  }

  if (b === null) {
    const ia = getIntegerPart(a);
    const fa = a.slice(ia.length);
    const i = incrementInteger(ia);
    if (i === undefined) {
      throw new Error('cannot increment any more');
    }
    return fa.length === 0 ? i : ia + midpoint(fa, undefined);
  }

  const ia = getIntegerPart(a);
  const fa = a.slice(ia.length);
  const ib = getIntegerPart(b);
  const fb = b.slice(ib.length);

  if (ia === ib) {
    return ia + midpoint(fa, fb);
  }

  const i = incrementInteger(ia);
  if (i === undefined) {
    throw new Error('cannot increment any more');
  }
  if (i < b) {
    return i;
  }
  return ia + midpoint(fa, undefined);
}

/**
 * Generate N fractional index keys between two existing keys.
 *
 * @param a - The key before the new positions (null for start)
 * @param b - The key after the new positions (null for end)
 * @param n - Number of keys to generate
 * @returns Array of n keys that sort between a and b (and between each other)
 */
export function generateNKeysBetween(a: string | null, b: string | null, n: number): string[] {
  if (n === 0) return [];
  if (n === 1) return [generateKeyBetween(a, b)];

  if (b === null) {
    let c = generateKeyBetween(a, b);
    const result = [c];
    for (let i = 1; i < n; i++) {
      c = generateKeyBetween(c, b);
      result.push(c);
    }
    return result;
  }

  if (a === null) {
    let c = generateKeyBetween(a, b);
    const result = [c];
    for (let i = 1; i < n; i++) {
      c = generateKeyBetween(a, c);
      result.unshift(c);
    }
    return result;
  }

  const mid = Math.floor(n / 2);
  const c = generateKeyBetween(a, b);
  return [...generateNKeysBetween(a, c, mid), c, ...generateNKeysBetween(c, b, n - mid - 1)];
}
