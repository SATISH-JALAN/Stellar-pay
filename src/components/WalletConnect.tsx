import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
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
    const [copied, setCopied] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const connectBtnRef = useRef<HTMLButtonElement>(null);

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

    // Button hover animation
    useEffect(() => {
        const btn = connectBtnRef.current;
        if (!btn) return;

        const handleEnter = () => {
            gsap.to(btn, { scale: 1.02, duration: 0.2, ease: 'power2.out' });
        };
        const handleLeave = () => {
            gsap.to(btn, { scale: 1, duration: 0.2, ease: 'power2.out' });
        };
        const handleDown = () => {
            gsap.to(btn, { scale: 0.98, duration: 0.1 });
        };
        const handleUp = () => {
            gsap.to(btn, { scale: 1.02, duration: 0.15, ease: 'back.out(2)' });
        };

        btn.addEventListener('mouseenter', handleEnter);
        btn.addEventListener('mouseleave', handleLeave);
        btn.addEventListener('mousedown', handleDown);
        btn.addEventListener('mouseup', handleUp);

        return () => {
            btn.removeEventListener('mouseenter', handleEnter);
            btn.removeEventListener('mouseleave', handleLeave);
            btn.removeEventListener('mousedown', handleDown);
            btn.removeEventListener('mouseup', handleUp);
        };
    }, [publicKey]);

    const copyAddress = async () => {
        if (!publicKey) return;

        try {
            await navigator.clipboard.writeText(publicKey);
            setCopied(true);

            // Animate the copy feedback
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

    if (publicKey) {
        return (
            <div className="wallet-card wallet-connected" ref={cardRef}>
                <div className="wallet-header">
                    <span className="wallet-icon">👛</span>
                    <h3>Wallet Connected</h3>
                    <span className="network-badge">{network}</span>
                </div>
                <div className="wallet-info">
                    <div className="address-row">
                        <p className="public-key" title={publicKey}>
                            {formatPublicKey(publicKey)}
                        </p>
                        <button
                            className="copy-btn"
                            onClick={copyAddress}
                            title="Copy address"
                        >
                            {copied ? '✓' : '📋'}
                        </button>
                    </div>
                    {copied && <span className="copied-toast">Copied!</span>}
                </div>
                <button className="btn btn-disconnect" onClick={onDisconnect}>
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <div className="wallet-card" ref={cardRef}>
            <div className="wallet-header">
                <span className="wallet-icon">👛</span>
                <h3>Connect Wallet</h3>
            </div>
            <p className="wallet-description">
                Connect your Freighter wallet to start sending XLM on testnet.
            </p>
            {error && <p className="error-message">{error}</p>}
            <button
                ref={connectBtnRef}
                className="btn btn-connect"
                onClick={onConnect}
                disabled={isConnecting}
            >
                {isConnecting ? 'Connecting...' : 'Connect Freighter'}
            </button>
        </div>
    );
};
