import React, { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { getBalance } from '../utils/stellar';
import './BalanceDisplay.css';

interface BalanceDisplayProps {
    publicKey: string;
}

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ publicKey }) => {
    const [balance, setBalance] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const amountRef = useRef<HTMLSpanElement>(null);
    const prevBalanceRef = useRef<number>(0);

    const fetchBalance = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const bal = await getBalance(publicKey);
            const newBalance = parseFloat(bal);

            // Animate the number if we have a previous balance
            if (amountRef.current && prevBalanceRef.current !== newBalance) {
                gsap.fromTo(
                    amountRef.current,
                    { scale: 1.1, color: 'var(--color-accent-gold)' },
                    {
                        scale: 1,
                        color: 'var(--color-accent-teal)',
                        duration: 0.5,
                        ease: 'back.out(2)'
                    }
                );
            }

            prevBalanceRef.current = newBalance;
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

    // Animate card on mount
    const cardRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (cardRef.current && !isLoading && balance) {
            gsap.fromTo(
                amountRef.current,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
            );
        }
    }, [isLoading, balance]);

    return (
        <div className="balance-card" ref={cardRef}>
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
                    <span className="amount" ref={amountRef}>
                        {parseFloat(balance).toLocaleString()}
                    </span>
                    <span className="currency">XLM</span>
                </div>
            )}
        </div>
    );
};
