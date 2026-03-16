import * as StellarSdk from '@stellar/stellar-sdk';
import { cache, TTL } from './cache';

// Initialize Horizon server for Testnet
export const server = new StellarSdk.Horizon.Server(
  'https://horizon-testnet.stellar.org'
);

export const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

/**
 * Fetch XLM balance for a given public key (cached for 15s)
 */
export const getBalance = async (publicKey: string): Promise<string> => {
  const cacheKey = `balance:${publicKey}`;
  const cached = cache.get<string>(cacheKey);
  if (cached !== null) return cached;

  try {
    const account = await server.loadAccount(publicKey);
    const xlmBalance = account.balances.find(
      (b) => b.asset_type === 'native'
    );
    const balance = xlmBalance?.balance || '0';
    cache.set(cacheKey, balance, TTL.BALANCE);
    return balance;
  } catch (error) {
    console.error('Error fetching balance:', error);
    throw error;
  }
};

/**
 * Validate if a string is a valid Stellar public key
 */
export const isValidPublicKey = (key: string): boolean => {
  try {
    StellarSdk.StrKey.decodeEd25519PublicKey(key);
    return true;
  } catch {
    return false;
  }
};

/**
 * Create a payment transaction XDR
 */
export const createPaymentTransaction = async (
  sourcePublicKey: string,
  destinationPublicKey: string,
  amount: string
): Promise<string> => {
  const account = await server.loadAccount(sourcePublicKey);
  const fee = await server.fetchBaseFee();

  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: fee.toString(),
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: destinationPublicKey,
        asset: StellarSdk.Asset.native(),
        amount: amount,
      })
    )
    .setTimeout(30)
    .build();

  return transaction.toXDR();
};

/**
 * Submit a signed transaction to the network
 * Invalidates balance cache for the source account after submission
 */
export const submitTransaction = async (
  signedXDR: string,
  sourcePublicKey?: string
): Promise<StellarSdk.Horizon.HorizonApi.SubmitTransactionResponse> => {
  const transaction = StellarSdk.TransactionBuilder.fromXDR(
    signedXDR,
    NETWORK_PASSPHRASE
  );
  const result = await server.submitTransaction(transaction);
  // Bust balance cache so next fetch is fresh
  if (sourcePublicKey) cache.invalidate(`balance:${sourcePublicKey}`);
  return result;
};

/**
 * Format public key for display (truncated)
 */
export const formatPublicKey = (key: string): string => {
  if (key.length <= 12) return key;
  return `${key.slice(0, 6)}...${key.slice(-6)}`;
};
