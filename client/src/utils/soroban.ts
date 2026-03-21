import {
  Networks,
  Contract,
  TransactionBuilder,
  Account,
  Keypair,
  StrKey,
  Address,
  nativeToScVal,
  scValToNative,
  Transaction,
  xdr,
} from "@stellar/stellar-sdk";
import { Server, Api, assembleTransaction } from "@stellar/stellar-sdk/rpc";

// Contract deployed on testnet
export const PAYMENT_REGISTRY_CONTRACT =
  "CAIORM4STQRH5V7N6IGHGTEGWG2QNIK7GIZ5GL6WLMNEH73PHJY4YPSC";
export const DEPLOY_TX_HASH =
  "c85528509f0934f0711d288146df4e776c4bd5df582d352fd5a52d39fc8dabf3";

const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;
const SIMULATION_SOURCE_ACCOUNT = Keypair.random().publicKey();

const server = new Server(SOROBAN_RPC_URL);

export interface OnChainPayment {
  from: string;
  to: string;
  amount: string; // in XLM
  timestamp: number;
}

/** Simulate a read-only contract call and return the raw ScVal result */
async function simulateReadCall(
  fnName: string,
  args: xdr.ScVal[] = [],
  sourcePublicKey?: string,
) {
  const source =
    sourcePublicKey && StrKey.isValidEd25519PublicKey(sourcePublicKey)
      ? sourcePublicKey
      : SIMULATION_SOURCE_ACCOUNT;

  let account: Account;
  try {
    account = await server.getAccount(source);
  } catch {
    // Fallback for read-only simulation when account load is unavailable.
    account = new Account(source, "0");
  }

  const contract = new Contract(PAYMENT_REGISTRY_CONTRACT);

  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(fnName, ...args))
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);

  if (Api.isSimulationSuccess(simulated) && simulated.result) {
    return simulated.result.retval;
  }
  return null;
}

/** Parse a Soroban Payment struct ScVal into a plain JS object */
function parsePayment(scVal: xdr.ScVal): OnChainPayment | null {
  try {
    const native = scValToNative(scVal) as Record<string, unknown>;
    return {
      from: String(native.from),
      to: String(native.to),
      amount: (Number(native.amount) / 10_000_000).toFixed(7),
      timestamp: Number(native.timestamp),
    };
  } catch {
    return null;
  }
}

/**
 * Log a payment to the on-chain registry
 */
export async function prepareLogPaymentTx(
  sourcePublicKey: string,
  fromAddress: string,
  toAddress: string,
  amount: string,
): Promise<Transaction | null> {
  try {
    const account = await server.getAccount(sourcePublicKey);
    const contract = new Contract(PAYMENT_REGISTRY_CONTRACT);
    const amountInStroops = BigInt(Math.floor(parseFloat(amount) * 10_000_000));

    const operation = contract.call(
      "log_payment",
      Address.fromString(fromAddress).toScVal(),
      Address.fromString(toAddress).toScVal(),
      nativeToScVal(amountInStroops, { type: "i128" }),
    );

    const tx = new TransactionBuilder(account, {
      fee: "100000",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    const simulated = await server.simulateTransaction(tx);
    if (Api.isSimulationError(simulated)) {
      console.error("Simulation error:", simulated);
      return null;
    }

    return assembleTransaction(tx, simulated).build() as Transaction;
  } catch (error) {
    console.error("Error preparing log_payment transaction:", error);
    return null;
  }
}

/**
 * Get the total payment count from the registry
 */
export async function getPaymentCount(
  sourcePublicKey?: string,
): Promise<number> {
  try {
    const result = await simulateReadCall(
      "get_payment_count",
      [],
      sourcePublicKey,
    );
    if (result) return Number(scValToNative(result));
    return 0;
  } catch (error) {
    console.error("Error getting payment count:", error);
    return 0;
  }
}

/**
 * Get a specific payment by index (0-based)
 */
export async function getPayment(
  index: number,
  sourcePublicKey?: string,
): Promise<OnChainPayment | null> {
  try {
    const result = await simulateReadCall(
      "get_payment",
      [nativeToScVal(index, { type: "u32" })],
      sourcePublicKey,
    );
    if (!result) return null;

    // Contract returns Option<Payment> - unwrap the Some variant
    const native = scValToNative(result);
    if (native === null || native === undefined) return null;

    return parsePayment(result);
  } catch (error) {
    console.error("Error getting payment:", error);
    return null;
  }
}

/**
 * Get the most recent payments (up to 10) from the registry
 */
export async function getRecentPayments(
  sourcePublicKey?: string,
): Promise<OnChainPayment[]> {
  try {
    const result = await simulateReadCall(
      "get_recent_payments",
      [],
      sourcePublicKey,
    );
    if (!result) return [];

    const native = scValToNative(result);
    if (!Array.isArray(native)) return [];

    // Re-parse each entry from the raw ScVal vec
    const vec = result.vec();
    if (!vec) return [];

    return vec
      .map((item) => parsePayment(item))
      .filter((p): p is OnChainPayment => p !== null);
  } catch (error) {
    console.error("Error getting recent payments:", error);
    return [];
  }
}

export function getContractExplorerUrl(): string {
  return `https://stellar.expert/explorer/testnet/contract/${PAYMENT_REGISTRY_CONTRACT}`;
}

export function getDeployTxUrl(): string {
  return `https://stellar.expert/explorer/testnet/tx/${DEPLOY_TX_HASH}`;
}
