import { 
    Networks, 
    Contract, 
    TransactionBuilder, 
    Address, 
    nativeToScVal, 
    scValToNative,
    Horizon
} from '@stellar/stellar-sdk';
import { Server, Api, assembleTransaction } from '@stellar/stellar-sdk/rpc';

// Environment config
const SOROBAN_RPC_URL = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
const HORIZON_URL = process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = process.env.NETWORK_PASSPHRASE || Networks.TESTNET;
const PAYMENT_REGISTRY_CONTRACT = process.env.PAYMENT_REGISTRY_CONTRACT || 'CDXQDRTF2BRCD63QVUBUUDC2DIQHHCDBAPA6P3UD5EVRMRN4O327VERK';
export const DEPLOY_TX_HASH = 'f4e40d4cd4cc41e397c73a584aa97a3ef587e7d0fb6038da4f1b592e19b48fcf';

// Servers
const sorobanServer = new Server(SOROBAN_RPC_URL);
const horizonServer = new Horizon.Server(HORIZON_URL);

/**
 * Get account balance
 */
export async function getBalance(publicKey: string): Promise<string> {
    try {
        const account = await horizonServer.loadAccount(publicKey);
        const nativeBalance = account.balances.find(
            (b: Horizon.HorizonApi.BalanceLine) => b.asset_type === 'native'
        );
        return nativeBalance ? nativeBalance.balance : '0';
    } catch (error) {
        console.error('Error getting balance:', error);
        return '0';
    }
}

/**
 * Get transaction history
 */
export async function getTransactions(publicKey: string, limit: number = 10) {
    try {
        const transactions = await horizonServer
            .transactions()
            .forAccount(publicKey)
            .order('desc')
            .limit(limit)
            .call();
        
        return transactions.records.map(tx => ({
            id: tx.id,
            hash: tx.hash,
            created_at: tx.created_at,
            source_account: tx.source_account,
            successful: tx.successful,
            fee_charged: tx.fee_charged,
            memo: tx.memo,
        }));
    } catch (error) {
        console.error('Error getting transactions:', error);
        return [];
    }
}

/**
 * Get payment count from registry contract
 */
export async function getPaymentCount(): Promise<number> {
    try {
        const account = await sorobanServer.getAccount(PAYMENT_REGISTRY_CONTRACT);
        const contract = new Contract(PAYMENT_REGISTRY_CONTRACT);
        
        const tx = new TransactionBuilder(account, {
            fee: '100',
            networkPassphrase: NETWORK_PASSPHRASE,
        })
            .addOperation(contract.call('get_payment_count'))
            .setTimeout(30)
            .build();

        const simulated = await sorobanServer.simulateTransaction(tx);
        
        if (Api.isSimulationSuccess(simulated) && simulated.result) {
            return Number(scValToNative(simulated.result.retval));
        }
        
        return 0;
    } catch (error) {
        console.error('Error getting payment count:', error);
        return 0;
    }
}

/**
 * Prepare log_payment transaction (returns unsigned XDR)
 */
export async function prepareLogPaymentTx(
    sourcePublicKey: string,
    fromAddress: string,
    toAddress: string,
    amount: string
): Promise<string | null> {
    try {
        const account = await sorobanServer.getAccount(sourcePublicKey);
        const contract = new Contract(PAYMENT_REGISTRY_CONTRACT);
        
        const amountInStroops = BigInt(Math.floor(parseFloat(amount) * 10000000));
        
        const operation = contract.call(
            'log_payment',
            Address.fromString(fromAddress).toScVal(),
            Address.fromString(toAddress).toScVal(),
            nativeToScVal(amountInStroops, { type: 'i128' })
        );

        const tx = new TransactionBuilder(account, {
            fee: '100000',
            networkPassphrase: NETWORK_PASSPHRASE,
        })
            .addOperation(operation)
            .setTimeout(30)
            .build();

        const simulated = await sorobanServer.simulateTransaction(tx);
        
        if (Api.isSimulationError(simulated)) {
            console.error('Simulation error:', simulated);
            return null;
        }

        const prepared = assembleTransaction(tx, simulated).build();
        return prepared.toXDR();
    } catch (error) {
        console.error('Error preparing log_payment:', error);
        return null;
    }
}

/**
 * Get contract info
 */
export function getContractInfo() {
    return {
        contractId: PAYMENT_REGISTRY_CONTRACT,
        deployTxHash: DEPLOY_TX_HASH,
        network: 'testnet',
        explorerUrl: `https://stellar.expert/explorer/testnet/contract/${PAYMENT_REGISTRY_CONTRACT}`,
        deployTxUrl: `https://stellar.expert/explorer/testnet/tx/${DEPLOY_TX_HASH}`,
    };
}
