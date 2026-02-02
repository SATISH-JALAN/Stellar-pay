import React from 'react';
import { formatPublicKey } from '../utils/stellar';
import './WalletConnect.css';

interface WalletConnectProps {
    publicKey: string | null;
    isConnecting: boolean;
    error: string | null;
    network: string | null;
    onConnect: () => void;
    onDisconnect: () => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
    publicKey,
    isConnecting,
    error,
    network,
    onConnect,
    onDisconnect,
}) => {
    if (publicKey) {
        return (
            <div className="wallet-card wallet-connected">
                <div className="wallet-header">
                    <span className="wallet-icon">👛</span>
                    <h3>Wallet Connected</h3>
                    <span className="network-badge">{network}</span>
                </div>
                <div className="wallet-info">
                    <p className="public-key" title={publicKey}>
                        {formatPublicKey(publicKey)}
                    </p>
                </div>
                <button className="btn btn-disconnect" onClick={onDisconnect}>
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <div className="wallet-card">
            <div className="wallet-header">
                <span className="wallet-icon">👛</span>
                <h3>Connect Wallet</h3>
            </div>
            <p className="wallet-description">
                Connect your Freighter wallet to start sending XLM on testnet.
            </p>
            {error && <p className="error-message">{error}</p>}
            <button
                className="btn btn-connect"
                onClick={onConnect}
                disabled={isConnecting}
            >
                {isConnecting ? 'Connecting...' : 'Connect Freighter'}
            </button>
        </div>
    );
};
