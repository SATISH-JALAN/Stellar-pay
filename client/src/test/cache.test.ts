import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { cache } from '../utils/cache';

describe('SimpleCache', () => {
  beforeEach(() => cache.clear());
  afterEach(() => vi.useRealTimers());

  it('stores and retrieves a value within TTL', () => {
    cache.set('key1', 'hello', 5000);
    expect(cache.get('key1')).toBe('hello');
  });

  it('returns null for a missing key', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('returns null after TTL expires', () => {
    vi.useFakeTimers();
    cache.set('key2', 42, 1000);
    vi.advanceTimersByTime(1001);
    expect(cache.get('key2')).toBeNull();
  });

  it('invalidates a specific key', () => {
    cache.set('key3', 'data', 5000);
    cache.invalidate('key3');
    expect(cache.get('key3')).toBeNull();
  });

  it('invalidates all keys with a given prefix', () => {
    cache.set('balance:GABC', 100, 5000);
    cache.set('balance:GXYZ', 200, 5000);
    cache.set('price:XLM', 0.1, 5000);
    cache.invalidatePrefix('balance:');
    expect(cache.get('balance:GABC')).toBeNull();
    expect(cache.get('balance:GXYZ')).toBeNull();
    expect(cache.get('price:XLM')).toBe(0.1);
  });

  it('clears all entries', () => {
    cache.set('a', 1, 5000);
    cache.set('b', 2, 5000);
    cache.clear();
    expect(cache.size()).toBe(0);
  });

  it('overwrites an existing key', () => {
    cache.set('key4', 'old', 5000);
    cache.set('key4', 'new', 5000);
    expect(cache.get('key4')).toBe('new');
  });
});
