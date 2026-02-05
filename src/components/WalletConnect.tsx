import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { formatPublicKey } from '../utils/stellar';
import { QRCodeDisplay } from './QRCode';
import './WalletConnect.css';

interface WalletOption {
    id: string;
    name: string;
    icon: string;
    description: string;
}

interface WalletConnectProps {
    publicKey: string | null;
    isConnecting: boolean;
    error: string | null;
    network: string | null;
    selectedWalletName?: string | null;
    selectedWalletIcon?: string | null;
    walletOptions?: WalletOption[];
    onConnect: () => void;
    onConnectWithWallet?: (walletId: string) => void;
    onDisconnect: () => void;
    onClearError?: () => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
    publicKey,
    isConnecting,
    error,
    network,
    selectedWalletName,
    selectedWalletIcon,
    walletOptions = [],
    onConnect,
    onConnectWithWallet,
    onDisconnect,
    onClearError,
}) => {
    const [copied, setCopied] = useState(false);
    const [showWalletSelector, setShowWalletSelector] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const selectorRef = useRef<HTMLDivElement>(null);

    // Initial animation
    useEffect(() => {
        if (cardRef.current) {
            gsap.fromTo(
                cardRef.current,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
            );
        }
    }, []);

    // Animate wallet selector
    useEffect(() => {
        if (selectorRef.current && showWalletSelector) {
            gsap.fromTo(
                selectorRef.current,
                { opacity: 0, y: -10, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(2)' }
            );
        }
    }, [showWalletSelector]);

    const copyAddress = async () => {
        if (!publicKey) return;

        try {
            await navigator.clipboard.writeText(publicKey);
            setCopied(true);

            const toast = document.querySelector('.copied-toast');
            if (toast) {
                gsap.fromTo(
                    toast,
                    { opacity: 0, y: -10 },
                    { opacity: 1, y: 0, duration: 0.3, ease: 'back.out(2)' }
                );
            }

            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleWalletSelect = (walletId: string) => {
        setShowWalletSelector(false);
        if (onClearError) onClearError();
        if (onConnectWithWallet) {
            onConnectWithWallet(walletId);
        } else {
            onConnect();
        }
    };

    const toggleWalletSelector = () => {
        if (onClearError) onClearError();
        setShowWalletSelector(!showWalletSelector);
    };

    // Connected state
    if (publicKey) {
        return (
            <div className="wallet-card wallet-connected" ref={cardRef}>
                <div className="wallet-header">
                    <span className="wallet-icon">{selectedWalletIcon || '👛'}</span>
                    <h3>Wallet Connected</h3>
                    <span className="network-badge">{network}</span>
                </div>
                {selectedWalletName && (
                    <div className="connected-wallet-name">
                        via {selectedWalletName}
                    </div>
                )}
                <div className="wallet-info">
                    <div className="address-row">
                        <p className="public-key" title={publicKey}>
                            {formatPublicKey(publicKey)}
                        </p>
                        <button
                            className="copy-btn"
                            onClick={copyAddress}
                            title="Copy Address - Copy your Stellar address to clipboard"
                        >
                            {copied ? '✓' : '📋'}
                        </button>
                        <QRCodeDisplay address={publicKey} />
                    </div>
                    {copied && <span className="copied-toast">Copied!</span>}
                </div>
                <button className="btn btn-disconnect" onClick={onDisconnect}>
                    Disconnect
                </button>
            </div>
        );
    }

    // Disconnected state with wallet selector
    return (
        <div className="wallet-card" ref={cardRef}>
            <div className="wallet-header">
                <span className="wallet-icon">👛</span>
                <h3>Connect Wallet</h3>
            </div>
            <p className="wallet-description">
                Choose a wallet to connect and start sending XLM on testnet.
            </p>

            {error && (
                <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    <span>{error}</span>
                    {onClearError && (
                        <button className="error-dismiss" onClick={onClearError}>×</button>
                    )}
                </div>
            )}

            {/* Wallet Selector */}
            {walletOptions.length > 0 ? (
                <>
                    <button
                        className="btn btn-connect wallet-selector-toggle"
                        onClick={toggleWalletSelector}
                        disabled={isConnecting}
                    >
                        {isConnecting ? 'Connecting...' : 'Select Wallet'}
                        <span className={`toggle-arrow ${showWalletSelector ? 'open' : ''}`}>▼</span>
                    </button>

                    {showWalletSelector && (
                        <div className="wallet-selector" ref={selectorRef}>
                            {walletOptions.map((wallet) => (
                                <button
                                    key={wallet.id}
                                    className="wallet-option"
                                    onClick={() => handleWalletSelect(wallet.id)}
                                    disabled={isConnecting}
                                >
                                    <span className="wallet-option-icon">{wallet.icon}</span>
                                    <div className="wallet-option-info">
                                        <span className="wallet-option-name">{wallet.name}</span>
                                        <span className="wallet-option-desc">{wallet.description}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <button
                    className="btn btn-connect"
                    onClick={onConnect}
                    disabled={isConnecting}
                >
                    {isConnecting ? 'Connecting...' : 'Connect Freighter'}
                </button>
            )}
        </div>
    );
};
