import { 
    Networks, 
    Contract, 
    TransactionBuilder, 
    Address, 
    nativeToScVal, 
    scValToNative,
    Transaction
} from '@stellar/stellar-sdk';
import { Server, Api, assembleTransaction } from '@stellar/stellar-sdk/rpc';

// Contract deployed on testnet
export const PAYMENT_REGISTRY_CONTRACT = 'CDXQDRTF2BRCD63QVUBUUDC2DIQHHCDBAPA6P3UD5EVRMRN4O327VERK';
export const DEPLOY_TX_HASH = 'f4e40d4cd4cc41e397c73a584aa97a3ef587e7d0fb6038da4f1b592e19b48fcf';

const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;

// Create Soroban RPC server instance
const server = new Server(SOROBAN_RPC_URL);

/**
 * Log a payment to the on-chain registry
 * Note: This requires signing by the wallet
 */
export async function prepareLogPaymentTx(
    sourcePublicKey: string,
    fromAddress: string,
    toAddress: string,
    amount: string
): Promise<Transaction | null> {
    try {
        const account = await server.getAccount(sourcePublicKey);
        
        const contract = new Contract(PAYMENT_REGISTRY_CONTRACT);
        
        // Convert amount to i128 (stroops - 1 XLM = 10^7 stroops)
        const amountInStroops = BigInt(Math.floor(parseFloat(amount) * 10000000));
        
        const operation = contract.call(
            'log_payment',
            Address.fromString(fromAddress).toScVal(),
            Address.fromString(toAddress).toScVal(),
            nativeToScVal(amountInStroops, { type: 'i128' })
        );

        const tx = new TransactionBuilder(account, {
            fee: '100000', // 0.01 XLM fee
            networkPassphrase: NETWORK_PASSPHRASE,
        })
            .addOperation(operation)
            .setTimeout(30)
            .build();

        // Simulate to get proper resource footprint
        const simulated = await server.simulateTransaction(tx);
        
        if (Api.isSimulationError(simulated)) {
            console.error('Simulation error:', simulated);
            return null;
        }

        // Prepare transaction with proper resources
        const prepared = assembleTransaction(tx, simulated).build();
        
        return prepared as Transaction;
    } catch (error) {
        console.error('Error preparing log_payment transaction:', error);
        return null;
    }
}

/**
 * Get the total payment count from the registry
 */
export async function getPaymentCount(): Promise<number> {
    try {
        const account = await server.getAccount(PAYMENT_REGISTRY_CONTRACT);
        const contract = new Contract(PAYMENT_REGISTRY_CONTRACT);
        
        // Create a read-only transaction
        const tx = new TransactionBuilder(account, {
            fee: '100',
            networkPassphrase: NETWORK_PASSPHRASE,
        })
            .addOperation(contract.call('get_payment_count'))
            .setTimeout(30)
            .build();

        const simulated = await server.simulateTransaction(tx);
        
        if (Api.isSimulationSuccess(simulated) && simulated.result) {
            const result = simulated.result.retval;
            return Number(scValToNative(result));
        }
        
        return 0;
    } catch (error) {
        console.error('Error getting payment count:', error);
        return 0;
    }
}

/**
 * Get contract explorer URL
 */
export function getContractExplorerUrl(): string {
    return `https://stellar.expert/explorer/testnet/contract/${PAYMENT_REGISTRY_CONTRACT}`;
}

/**
 * Get deploy transaction URL
 */
export function getDeployTxUrl(): string {
    return `https://stellar.expert/explorer/testnet/tx/${DEPLOY_TX_HASH}`;
}
