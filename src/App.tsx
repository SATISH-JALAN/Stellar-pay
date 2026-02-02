import { useState, useCallback, useEffect } from 'react';
import { signTransaction } from '@stellar/freighter-api';
import { useWallet } from './hooks/useWallet';
import { WalletConnect } from './components/WalletConnect';
import { BalanceDisplay } from './components/BalanceDisplay';
import { SendPayment } from './components/SendPayment';
import { TransactionStatus } from './components/TransactionStatus';
import {
  getBalance,
  createPaymentTransaction,
  submitTransaction,
  NETWORK_PASSPHRASE,
} from './utils/stellar';
import './App.css';

function App() {
  const wallet = useWallet();
  const [balance, setBalance] = useState('0');
  const [isSending, setIsSending] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | undefined>();
  const [txError, setTxError] = useState<string | undefined>();

  // Fetch balance when wallet connects
  const fetchBalance = useCallback(async () => {
    if (wallet.publicKey) {
      try {
        const bal = await getBalance(wallet.publicKey);
        setBalance(bal);
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      }
    }
  }, [wallet.publicKey]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Handle sending payment
  const handleSend = async (destination: string, amount: string) => {
    if (!wallet.publicKey) return;

    setIsSending(true);
    setTxStatus('pending');
    setTxHash(undefined);
    setTxError(undefined);

    try {
      // Create the transaction
      const xdr = await createPaymentTransaction(wallet.publicKey, destination, amount);

      // Sign with Freighter
      const signResult = await signTransaction(xdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
      });

      if (signResult.error) {
        throw new Error(signResult.error);
      }

      // Submit to network
      const result = await submitTransaction(signResult.signedTxXdr);

      setTxHash(result.hash);
      setTxStatus('success');

      // Refresh balance
      await fetchBalance();
    } catch (error) {
      console.error('Transaction failed:', error);
      setTxError(error instanceof Error ? error.message : 'Transaction failed');
      setTxStatus('error');
    } finally {
      setIsSending(false);
    }
  };

  const closeTxStatus = () => {
    setTxStatus('idle');
    setTxHash(undefined);
    setTxError(undefined);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 Stellar Pay</h1>
        <p>Send XLM on Stellar Testnet</p>
      </header>

      <main className="app-main">
        <div className="card-grid">
          <WalletConnect
            publicKey={wallet.publicKey}
            isConnecting={wallet.isConnecting}
            error={wallet.error}
            network={wallet.network}
            onConnect={wallet.connect}
            onDisconnect={wallet.disconnect}
          />

          {wallet.publicKey && (
            <>
              <BalanceDisplay publicKey={wallet.publicKey} />
              <SendPayment
                balance={balance}
                onSend={handleSend}
                isLoading={isSending}
              />
            </>
          )}
        </div>
      </main>

      <TransactionStatus
        status={txStatus}
        hash={txHash}
        error={txError}
        onClose={closeTxStatus}
      />

      <footer className="app-footer">
        <p>
          Built for{' '}
          <a href="https://stellar.org" target="_blank" rel="noopener noreferrer">
            Stellar
          </a>{' '}
          White Belt Challenge
        </p>
      </footer>
    </div>
  );
}

export default App;
