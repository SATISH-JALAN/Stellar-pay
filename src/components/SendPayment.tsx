import React, { useState } from 'react';
import { isValidPublicKey, formatPublicKey } from '../utils/stellar';
import { AddressBook } from './AddressBook';
import './SendPayment.css';

interface SendPaymentProps {
    balance: string;
    onSend: (destination: string, amount: string) => Promise<void>;
    isLoading: boolean;
}

export const SendPayment: React.FC<SendPaymentProps> = ({
    balance,
    onSend,
    isLoading,
}) => {
    const [destination, setDestination] = useState('');
    const [amount, setAmount] = useState('');
    const [errors, setErrors] = useState<{ destination?: string; amount?: string }>({});
    const [showConfirm, setShowConfirm] = useState(false);

    const validate = (): boolean => {
        const newErrors: { destination?: string; amount?: string } = {};

        if (!destination.trim()) {
            newErrors.destination = 'Destination address is required';
        } else if (!isValidPublicKey(destination.trim())) {
            newErrors.destination = 'Invalid Stellar address';
        }

        if (!amount.trim()) {
            newErrors.amount = 'Amount is required';
        } else {
            const amountNum = parseFloat(amount);
            if (isNaN(amountNum) || amountNum <= 0) {
                newErrors.amount = 'Amount must be greater than 0';
            } else if (amountNum > parseFloat(balance)) {
                newErrors.amount = 'Insufficient balance';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            setShowConfirm(true);
        }
    };

    const handleConfirm = async () => {
        setShowConfirm(false);
        await onSend(destination.trim(), amount.trim());
        setDestination('');
        setAmount('');
    };

    const handleCancel = () => {
        setShowConfirm(false);
    };

    return (
        <>
            <div className="send-card">
                <div className="send-header">
                    <span className="send-icon">💸</span>
                    <h3>Send Payment</h3>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="destination">Destination Address</label>
                        <AddressBook onSelectAddress={(addr) => setDestination(addr)} />
                        <input
                            type="text"
                            id="destination"
                            placeholder="G..."
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            className={errors.destination ? 'error' : ''}
                            disabled={isLoading}
                        />
                        {errors.destination && (
                            <span className="error-text">{errors.destination}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="amount">Amount (XLM)</label>
                        <div className="amount-input-wrapper">
                            <input
                                type="number"
                                id="amount"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className={errors.amount ? 'error' : ''}
                                disabled={isLoading}
                                min="0"
                                step="0.0000001"
                            />
                            <button
                                type="button"
                                className="max-btn"
                                onClick={() => setAmount(balance)}
                                disabled={isLoading}
                            >
                                MAX
                            </button>
                        </div>
                        {errors.amount && <span className="error-text">{errors.amount}</span>}
                    </div>

                    <button type="submit" className="btn btn-send" disabled={isLoading}>
                        {isLoading ? 'Sending...' : 'Send XLM'}
                    </button>
                </form>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="confirm-modal">
                    <div className="confirm-content">
                        <div className="confirm-icon">⚠️</div>
                        <h4>Confirm Transaction</h4>
                        <p>You are about to send:</p>

                        <div className="confirm-details">
                            <div className="confirm-row">
                                <span className="confirm-label">Amount</span>
                                <span className="confirm-value">{amount} XLM</span>
                            </div>
                            <div className="confirm-row">
                                <span className="confirm-label">To</span>
                                <span className="confirm-value" title={destination}>
                                    {formatPublicKey(destination)}
                                </span>
                            </div>
                        </div>

                        <div className="confirm-actions">
                            <button className="btn btn-cancel" onClick={handleCancel}>
                                Cancel
                            </button>
                            <button className="btn btn-confirm" onClick={handleConfirm}>
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
