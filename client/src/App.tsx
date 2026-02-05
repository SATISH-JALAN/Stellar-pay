import { useState, useCallback, useEffect, useRef } from 'react';
import { signTransaction } from '@stellar/freighter-api';
import { gsap } from 'gsap';
import Lenis from 'lenis';
import { useWallet } from './hooks/useWallet';
import { WalletConnect } from './components/WalletConnect';
import { BalanceDisplay } from './components/BalanceDisplay';
import { SendPayment } from './components/SendPayment';
import { TransactionStatus } from './components/TransactionStatus';
import { ThemeToggle } from './components/ThemeToggle';
import { TransactionHistory } from './components/TransactionHistory';
import { BalanceChart } from './components/BalanceChart';
import { PriceDisplay } from './components/PriceDisplay';
import { FriendbotFund } from './components/FriendbotFund';
import { TransactionReceipt } from './components/TransactionReceipt';
import { ContractStats } from './components/ContractStats';
import { saveRecentRecipient } from './components/RecentRecipients';
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
  const [lastTxDetails, setLastTxDetails] = useState<{
    hash: string;
    destination: string;
    amount: string;
    date: Date;
    status: 'success' | 'error';
  } | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const mainRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  // Initialize Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  // Animate logo on load
  useEffect(() => {
    if (logoRef.current) {
      const star = logoRef.current.querySelector('.logo-star');
      const text = logoRef.current.querySelector('.logo-text');

      gsap.fromTo(star,
        { opacity: 0, scale: 0, rotation: -180 },
        { opacity: 1, scale: 1, rotation: 0, duration: 0.8, ease: 'back.out(1.7)' }
      );

      gsap.fromTo(text,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.6, delay: 0.3, ease: 'power3.out' }
      );

      // Continuous glow
      gsap.to(star, {
        filter: 'drop-shadow(0 0 12px var(--color-accent-primary))',
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }
  }, []);

  // Animate cards on load
  useEffect(() => {
    if (mainRef.current) {
      const cards = mainRef.current.querySelectorAll('.wallet-card, .balance-card, .send-card');
      gsap.fromTo(cards,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, delay: 0.5, ease: 'power2.out' }
      );
    }
  }, [wallet.publicKey]);

  // Fetch balance
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
      const xdr = await createPaymentTransaction(wallet.publicKey, destination, amount);
      const signResult = await signTransaction(xdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
      });

      if (signResult.error) {
        throw new Error(signResult.error);
      }

      const result = await submitTransaction(signResult.signedTxXdr);
      setTxHash(result.hash);

      // Don't set txStatus to success - use receipt instead
      setTxStatus('idle');

      // Save to recent recipients
      saveRecentRecipient(destination);

      // Set up receipt (this handles success display)
      setLastTxDetails({
        hash: result.hash,
        destination,
        amount,
        date: new Date(),
        status: 'success',
      });
      setShowReceipt(true);

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
      <ThemeToggle />

      <main className="main" ref={mainRef}>
        <header className="header">
          <div className="logo" ref={logoRef}>
            <span className="logo-star">✦</span>
            <span className="logo-text">
              <span className="logo-stellar">STELLAR</span>
              <span className="logo-pay">PAY</span>
            </span>
          </div>
          <PriceDisplay />
        </header>

        {wallet.publicKey ? (
          <>
            {/* Hero - Send Payment (Main Feature) */}
            <SendPayment
              balance={balance}
              onSend={handleSend}
              isLoading={isSending}
            />

            {/* Dashboard Grid */}
            <div className="dashboard">
              <div className="dashboard-left">
                <WalletConnect
                  publicKey={wallet.publicKey}
                  isConnecting={wallet.isConnecting}
                  error={wallet.error}
                  network={wallet.network}
                  selectedWalletName={wallet.selectedWalletName}
                  selectedWalletIcon={wallet.selectedWalletIcon}
                  walletOptions={wallet.walletOptions}
                  onConnect={wallet.connect}
                  onConnectWithWallet={wallet.connectWithWallet}
                  onDisconnect={wallet.disconnect}
                  onClearError={wallet.clearError}
                />
                <BalanceDisplay publicKey={wallet.publicKey} />
                <FriendbotFund publicKey={wallet.publicKey} onFunded={fetchBalance} />
                <ContractStats publicKey={wallet.publicKey} />
              </div>
              <div className="dashboard-right">
                <BalanceChart publicKey={wallet.publicKey} />
                <TransactionHistory publicKey={wallet.publicKey} />
              </div>
            </div>
          </>
        ) : (
          <WalletConnect
            publicKey={wallet.publicKey}
            isConnecting={wallet.isConnecting}
            error={wallet.error}
            network={wallet.network}
            selectedWalletName={wallet.selectedWalletName}
            selectedWalletIcon={wallet.selectedWalletIcon}
            walletOptions={wallet.walletOptions}
            onConnect={wallet.connect}
            onConnectWithWallet={wallet.connectWithWallet}
            onDisconnect={wallet.disconnect}
            onClearError={wallet.clearError}
          />
        )}
      </main>

      {/* Only show TransactionStatus for pending/error, Receipt handles success */}
      {!showReceipt && (
        <TransactionStatus
          status={txStatus}
          hash={txHash}
          error={txError}
          onClose={closeTxStatus}
        />
      )}

      <TransactionReceipt
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        transaction={lastTxDetails}
      />
    </div>
  );
}

export default App;
