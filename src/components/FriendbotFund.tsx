import { useState } from 'react';
import { isValidPublicKey } from '../utils/stellar';
import './FriendbotFund.css';

interface FriendbotFundProps {
    publicKey: string;
    onFunded: () => void;
}

export const FriendbotFund = ({ publicKey, onFunded }: FriendbotFundProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [showCustomAddress, setShowCustomAddress] = useState(false);
    const [customAddress, setCustomAddress] = useState('');
    const [addressError, setAddressError] = useState('');

    const handleFund = async (addressToFund: string) => {
        if (!addressToFund.trim()) {
            setAddressError('Address is required');
            return;
        }

        if (!isValidPublicKey(addressToFund.trim())) {
            setAddressError('Invalid Stellar address');
            return;
        }

        setIsLoading(true);
        setStatus('idle');
        setMessage('');
        setAddressError('');

        try {
            const response = await fetch(
                `https://friendbot.stellar.org?addr=${encodeURIComponent(addressToFund.trim())}`
            );

            if (!response.ok) {
                throw new Error('Funding failed');
            }

            setStatus('success');
            const isOwnAccount = addressToFund.trim() === publicKey;
            setMessage(isOwnAccount
                ? '10,000 XLM added to your account!'
                : `10,000 XLM sent to ${addressToFund.slice(0, 8)}...${addressToFund.slice(-8)}`
            );

            if (isOwnAccount) {
                onFunded();
            }

            // Reset custom address field on success
            if (showCustomAddress) {
                setCustomAddress('');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Account may already be funded or rate limited. Try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFundConnected = () => handleFund(publicKey);
    const handleFundCustom = () => handleFund(customAddress);

    return (
        <div className="friendbot-card">
            <div className="friendbot-content">
                <div className="friendbot-info">
                    <span className="friendbot-icon">🤖</span>
                    <div className="friendbot-text">
                        <span className="friendbot-title">Testnet Faucet</span>
                        <span className="friendbot-desc">Get free test tokens from Friendbot</span>
                    </div>
                </div>
                <button
                    className="friendbot-btn"
                    onClick={handleFundConnected}
                    disabled={isLoading || showCustomAddress}
                    title="Fund your connected wallet with 10,000 testnet XLM"
                >
                    {isLoading && !showCustomAddress ? 'Funding...' : 'Fund My Wallet'}
                </button>
            </div>

            {/* Toggle for custom address */}
            <button
                className="toggle-custom-btn"
                onClick={() => {
                    setShowCustomAddress(!showCustomAddress);
                    setAddressError('');
                    setStatus('idle');
                }}
            >
                {showCustomAddress ? '← Fund My Wallet' : 'Fund Another Address →'}
            </button>

            {/* Custom address input */}
            {showCustomAddress && (
                <div className="custom-address-section">
                    <div className="custom-input-wrapper">
                        <input
                            type="text"
                            className={`custom-address-input ${addressError ? 'error' : ''}`}
                            placeholder="Enter Stellar address (G...)"
                            value={customAddress}
                            onChange={(e) => {
                                setCustomAddress(e.target.value);
                                setAddressError('');
                            }}
                            disabled={isLoading}
                        />
                        <button
                            className="fund-custom-btn"
                            onClick={handleFundCustom}
                            disabled={isLoading || !customAddress.trim()}
                        >
                            {isLoading ? 'Funding...' : 'Fund'}
                        </button>
                    </div>
                    {addressError && (
                        <span className="address-error">{addressError}</span>
                    )}
                </div>
            )}

            {status !== 'idle' && (
                <div className={`friendbot-status ${status}`}>
                    {message}
                </div>
            )}
        </div>
    );
};
