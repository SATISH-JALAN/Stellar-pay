import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  getWalletKit, 
  WALLET_OPTIONS, 
  getWalletName,
  getWalletIcon,
  FREIGHTER_ID 
} from '../utils/walletKit';
import type { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';

interface WalletState {
  publicKey: string | null;
  isConnecting: boolean;
  error: string | null;
  network: string | null;
  selectedWalletId: string | null;
  selectedWalletName: string | null;
  selectedWalletIcon: string | null;
}

export const useWallet = () => {
  const kitRef = useRef<StellarWalletsKit | null>(null);
  const [state, setState] = useState<WalletState>({
    publicKey: null,
    isConnecting: false,
    error: null,
    network: 'TESTNET',
    selectedWalletId: null,
    selectedWalletName: null,
    selectedWalletIcon: null,
  });

  // Initialize kit on mount
  useEffect(() => {
    kitRef.current = getWalletKit();
  }, []);

  // Auto-reconnect on mount if previously connected
  useEffect(() => {
    const checkExistingConnection = async () => {
      const savedWalletId = localStorage.getItem('stellar_wallet_id');
      const savedPublicKey = localStorage.getItem('stellar_public_key');
      
      if (savedWalletId && savedPublicKey) {
        setState(prev => ({
          ...prev,
          publicKey: savedPublicKey,
          selectedWalletId: savedWalletId,
          selectedWalletName: getWalletName(savedWalletId),
          selectedWalletIcon: getWalletIcon(savedWalletId),
        }));
      }
    };

    checkExistingConnection();
  }, []);

  // Connect with a specific wallet
  const connectWithWallet = useCallback(async (walletId: string) => {
    const kit = kitRef.current;
    if (!kit) {
      setState(prev => ({ 
        ...prev, 
        error: 'Wallet kit not initialized. Please refresh the page.' 
      }));
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Set the selected wallet
      kit.setWallet(walletId);

      // Get the address - this will trigger the wallet connection modal
      const { address } = await kit.getAddress();

      if (!address) {
        throw new Error('No address returned from wallet');
      }

      // Save to localStorage for auto-reconnect
      localStorage.setItem('stellar_wallet_id', walletId);
      localStorage.setItem('stellar_public_key', address);

      setState({
        publicKey: address,
        isConnecting: false,
        error: null,
        network: 'TESTNET',
        selectedWalletId: walletId,
        selectedWalletName: getWalletName(walletId),
        selectedWalletIcon: getWalletIcon(walletId),
      });
    } catch (error) {
      // Enhanced error handling
      let errorMessage = 'Failed to connect wallet';
      
      if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        
        // Wallet not found/installed
        if (msg.includes('not installed') || msg.includes('not found') || msg.includes('no wallet')) {
          errorMessage = `${getWalletName(walletId)} wallet is not installed. Please install it first.`;
        }
        // User rejected
        else if (msg.includes('rejected') || msg.includes('cancelled') || msg.includes('denied') || msg.includes('user refused')) {
          errorMessage = 'Connection cancelled. Please approve the request in your wallet.';
        }
        // Other errors
        else {
          errorMessage = error.message;
        }
      }

      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
      }));
    }
  }, []);

  // Legacy connect function (uses default Freighter)
  const connect = useCallback(async () => {
    await connectWithWallet(FREIGHTER_ID);
  }, [connectWithWallet]);

  const disconnect = useCallback(() => {
    localStorage.removeItem('stellar_wallet_id');
    localStorage.removeItem('stellar_public_key');
    
    setState({
      publicKey: null,
      isConnecting: false,
      error: null,
      network: null,
      selectedWalletId: null,
      selectedWalletName: null,
      selectedWalletIcon: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    connect,
    connectWithWallet,
    disconnect,
    clearError,
    isConnected: !!state.publicKey,
    walletOptions: WALLET_OPTIONS,
    kit: kitRef.current,
  };
};
