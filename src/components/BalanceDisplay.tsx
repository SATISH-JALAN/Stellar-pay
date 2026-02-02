import React, { useEffect, useState } from 'react';
import { getBalance } from '../utils/stellar';
import './BalanceDisplay.css';

interface BalanceDisplayProps {
    publicKey: string;
}

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ publicKey }) => {
    const [balance, setBalance] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBalance = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const bal = await getBalance(publicKey);
            setBalance(bal);
        } catch (err) {
            setError('Failed to fetch balance. Make sure your account is funded.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBalance();
    }, [publicKey]);

    return (
        <div className="balance-card">
            <div className="balance-header">
                <span className="balance-icon">💰</span>
                <h3>Your Balance</h3>
                <button className="refresh-btn" onClick={fetchBalance} disabled={isLoading}>
                    🔄
                </button>
            </div>

            {isLoading && (
                <div className="balance-loading">
                    <div className="spinner"></div>
                    <p>Loading balance...</p>
                </div>
            )}

            {error && <p className="balance-error">{error}</p>}

            {!isLoading && !error && balance && (
                <div className="balance-amount">
                    <span className="amount">{parseFloat(balance).toLocaleString()}</span>
                    <span className="currency">XLM</span>
                </div>
            )}

            <p className="balance-hint">
                Need testnet XLM?{' '}
                <a
                    href={`https://friendbot.stellar.org/?addr=${publicKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Get free XLM from Friendbot
                </a>
            </p>
        </div>
    );
};
