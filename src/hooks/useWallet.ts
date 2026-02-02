import { useState, useCallback } from 'react';
import {
  isConnected,
  requestAccess,
  getAddress,
  getNetwork,
} from '@stellar/freighter-api';

interface WalletState {
  publicKey: string | null;
  isConnecting: boolean;
  error: string | null;
  network: string | null;
}

export const useWallet = () => {
  const [state, setState] = useState<WalletState>({
    publicKey: null,
    isConnecting: false,
    error: null,
    network: null,
  });

  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Check if Freighter is installed
      const connectionResult = await isConnected();
      if (!connectionResult?.isConnected) {
        throw new Error(
          'Freighter wallet is not installed. Please install it from freighter.app'
        );
      }

      // Request access to the wallet
      const accessResult = await requestAccess();
      if (accessResult.error) {
        throw new Error(accessResult.error);
      }

      // Get the public key (address)
      const addressResult = await getAddress();
      if (addressResult.error) {
        throw new Error(addressResult.error);
      }

      // Get network info
      const networkResult = await getNetwork();

      setState({
        publicKey: addressResult.address,
        isConnecting: false,
        error: null,
        network: networkResult.network || 'TESTNET',
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      publicKey: null,
      isConnecting: false,
      error: null,
      network: null,
    });
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    isConnected: !!state.publicKey,
  };
};
