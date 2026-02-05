import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  FREIGHTER_ID,
  XBULL_ID,
  LOBSTR_ID,
  ALBEDO_ID,
} from '@creit.tech/stellar-wallets-kit';

// Wallet metadata for UI display
export const WALLET_OPTIONS = [
  {
    id: FREIGHTER_ID,
    name: 'Freighter',
    icon: '🦊',
    description: 'Most popular Stellar wallet',
  },
  {
    id: XBULL_ID,
    name: 'xBull',
    icon: '🐂',
    description: 'Feature-rich wallet',
  },
  {
    id: LOBSTR_ID,
    name: 'LOBSTR',
    icon: '🦞',
    description: 'Mobile-friendly wallet',
  },
  {
    id: ALBEDO_ID,
    name: 'Albedo',
    icon: '🌟',
    description: 'Web-based wallet',
  },
];

// Initialize the wallet kit with all available modules
export const createWalletKit = () => {
  return new StellarWalletsKit({
    network: WalletNetwork.TESTNET,
    selectedWalletId: FREIGHTER_ID, // Default wallet
    modules: allowAllModules(),
  });
};

// Singleton instance
let kitInstance: StellarWalletsKit | null = null;

export const getWalletKit = (): StellarWalletsKit => {
  if (!kitInstance) {
    kitInstance = createWalletKit();
  }
  return kitInstance;
};

// Helper to get wallet name from ID
export const getWalletName = (walletId: string): string => {
  const wallet = WALLET_OPTIONS.find(w => w.id === walletId);
  return wallet?.name || 'Unknown Wallet';
};

// Helper to get wallet icon from ID
export const getWalletIcon = (walletId: string): string => {
  const wallet = WALLET_OPTIONS.find(w => w.id === walletId);
  return wallet?.icon || '💳';
};

export { FREIGHTER_ID, XBULL_ID, LOBSTR_ID, ALBEDO_ID };
