import { useState } from 'react';
import './FriendbotFund.css';

interface FriendbotFundProps {
    publicKey: string;
    onFunded: () => void;
}

export const FriendbotFund = ({ publicKey, onFunded }: FriendbotFundProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleFund = async () => {
        setIsLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            const response = await fetch(
                `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
            );

            if (!response.ok) {
                throw new Error('Funding failed');
            }

            setStatus('success');
            setMessage('10,000 XLM added to your account!');
            onFunded();
        } catch (err) {
            setStatus('error');
            setMessage('Account may already be funded or rate limited. Try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="friendbot-card">
            <div className="friendbot-content">
                <div className="friendbot-info">
                    <span className="friendbot-icon">🤖</span>
                    <div className="friendbot-text">
                        <span className="friendbot-title">Need Testnet XLM?</span>
                        <span className="friendbot-desc">Get free test tokens from Friendbot</span>
                    </div>
                </div>
                <button
                    className="friendbot-btn"
                    onClick={handleFund}
                    disabled={isLoading}
                >
                    {isLoading ? 'Funding...' : 'Fund Account'}
                </button>
            </div>
            {status !== 'idle' && (
                <div className={`friendbot-status ${status}`}>
                    {message}
                </div>
            )}
        </div>
    );
};
