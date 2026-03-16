import { describe, it, expect } from 'vitest';
import { detectErrorType } from '../components/ErrorDisplay';

describe('detectErrorType', () => {
  it('detects wallet_not_found when message includes "not installed"', () => {
    expect(detectErrorType('Freighter is not installed')).toBe('wallet_not_found');
  });

  it('detects wallet_not_found when message includes "not found"', () => {
    expect(detectErrorType('Wallet not found on this browser')).toBe('wallet_not_found');
  });

  it('detects user_rejected when message includes "rejected"', () => {
    expect(detectErrorType('User rejected the request')).toBe('user_rejected');
  });

  it('detects user_rejected when message includes "cancelled"', () => {
    expect(detectErrorType('Transaction cancelled by user')).toBe('user_rejected');
  });

  it('detects insufficient_balance when message includes "insufficient"', () => {
    expect(detectErrorType('Insufficient balance to complete transaction')).toBe('insufficient_balance');
  });

  it('detects insufficient_balance when message includes "not enough"', () => {
    expect(detectErrorType('Not enough XLM in account')).toBe('insufficient_balance');
  });

  it('falls back to general for unknown errors', () => {
    expect(detectErrorType('Something went wrong on the network')).toBe('general');
  });

  it('is case-insensitive', () => {
    expect(detectErrorType('WALLET NOT FOUND')).toBe('wallet_not_found');
    expect(detectErrorType('USER REJECTED')).toBe('user_rejected');
  });
});
