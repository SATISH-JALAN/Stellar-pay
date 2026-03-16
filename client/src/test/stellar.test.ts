import { describe, it, expect } from 'vitest';
import { isValidPublicKey, formatPublicKey } from '../utils/stellar';

// A real valid Stellar testnet public key
const VALID_KEY = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

describe('isValidPublicKey', () => {
  it('returns true for a valid Stellar public key', () => {
    expect(isValidPublicKey(VALID_KEY)).toBe(true);
  });

  it('returns false for an empty string', () => {
    expect(isValidPublicKey('')).toBe(false);
  });

  it('returns false for a random string', () => {
    expect(isValidPublicKey('not-a-stellar-key')).toBe(false);
  });

  it('returns false for a truncated key', () => {
    expect(isValidPublicKey('GBBD47IF6LWK7P7MDEVSCWR7')).toBe(false);
  });
});

describe('formatPublicKey', () => {
  it('truncates a long key to first 6 and last 6 chars', () => {
    // formatPublicKey slices last 6 chars
    const expected = `${VALID_KEY.slice(0, 6)}...${VALID_KEY.slice(-6)}`;
    expect(formatPublicKey(VALID_KEY)).toBe(expected);
  });

  it('returns the key as-is if 12 chars or fewer', () => {
    expect(formatPublicKey('GABCDE')).toBe('GABCDE');
  });
});
