import { useState, useCallback, useEffect, useRef } from "react";
import {
  getWalletKit,
  WALLET_OPTIONS,
  getWalletName,
  getWalletIcon,
  FREIGHTER_ID,
} from "../utils/walletKit";
import type { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const cause = (error as { cause?: unknown }).cause;
    if (cause instanceof Error && cause.message) {
      return `${error.message}. ${cause.message}`;
    }
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.length > 0) {
      return maybeMessage;
    }
  }

  return "Failed to connect wallet";
};

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
    network: "TESTNET",
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
      const savedWalletId = localStorage.getItem("stellar_wallet_id");
      const savedPublicKey = localStorage.getItem("stellar_public_key");

      if (savedWalletId && savedPublicKey) {
        const kit = kitRef.current ?? getWalletKit();
        kitRef.current = kit;
        kit.setWallet(savedWalletId);

        setState((prev) => ({
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
    const kit = kitRef.current ?? getWalletKit();
    kitRef.current = kit;

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const supportedWallets = await kit.getSupportedWallets();
      const selected = supportedWallets.find(
        (wallet) => wallet.id === walletId,
      );
      if (selected && !selected.isAvailable) {
        throw new Error(
          `${getWalletName(walletId)} wallet is not installed or available in this browser.`,
        );
      }

      // Set the selected wallet
      kit.setWallet(walletId);

      // Get the address - this will trigger the wallet connection modal
      const { address } =
        walletId === FREIGHTER_ID
          ? await kit.getAddress({ skipRequestAccess: false })
          : await kit.getAddress();

      if (!address) {
        throw new Error("No address returned from wallet");
      }

      // Save to localStorage for auto-reconnect
      localStorage.setItem("stellar_wallet_id", walletId);
      localStorage.setItem("stellar_public_key", address);

      setState({
        publicKey: address,
        isConnecting: false,
        error: null,
        network: "TESTNET",
        selectedWalletId: walletId,
        selectedWalletName: getWalletName(walletId),
        selectedWalletIcon: getWalletIcon(walletId),
      });
    } catch (error) {
      // Enhanced error handling
      let errorMessage = "Failed to connect wallet";
      const rawMessage = extractErrorMessage(error);

      if (rawMessage) {
        const msg = rawMessage.toLowerCase();

        // Wallet not found/installed
        if (
          msg.includes("not installed") ||
          msg.includes("not found") ||
          msg.includes("no wallet") ||
          msg.includes("not available")
        ) {
          errorMessage = `${getWalletName(walletId)} wallet is not installed. Please install it first.`;
        }
        // User rejected
        else if (
          msg.includes("rejected") ||
          msg.includes("cancelled") ||
          msg.includes("denied") ||
          msg.includes("user refused")
        ) {
          errorMessage =
            "Connection cancelled. Please approve the request in your wallet.";
        }
        // Other errors
        else {
          errorMessage = rawMessage;
        }
      }

      setState((prev) => ({
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
    localStorage.removeItem("stellar_wallet_id");
    localStorage.removeItem("stellar_public_key");

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
    setState((prev) => ({ ...prev, error: null }));
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
