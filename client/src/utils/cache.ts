/**
 * Simple in-memory cache with TTL (time-to-live) support.
 * Used to reduce redundant API calls to Horizon and Soroban RPC.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class SimpleCache {
  private store = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

export const cache = new SimpleCache();

// TTL constants
export const TTL = {
  BALANCE: 15_000,       // 15 seconds
  TRANSACTIONS: 30_000,  // 30 seconds
  PRICE: 60_000,         // 1 minute
  CONTRACT: 30_000,      // 30 seconds
};
