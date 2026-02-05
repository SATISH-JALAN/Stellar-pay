import React from 'react';
import './ErrorDisplay.css';

// Error types for Yellow Belt requirement
export type ErrorType = 'wallet_not_found' | 'user_rejected' | 'insufficient_balance' | 'general';

interface ErrorDisplayProps {
    message: string;
    type?: ErrorType;
    onDismiss?: () => void;
    className?: string;
}

const ERROR_ICONS: Record<ErrorType, string> = {
    wallet_not_found: '🔌',
    user_rejected: '🚫',
    insufficient_balance: '💸',
    general: '⚠️',
};

const ERROR_TITLES: Record<ErrorType, string> = {
    wallet_not_found: 'Wallet Not Found',
    user_rejected: 'Request Cancelled',
    insufficient_balance: 'Insufficient Balance',
    general: 'Error',
};

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
    message,
    type = 'general',
    onDismiss,
    className = '',
}) => {
    return (
        <div className={`error-display error-${type} ${className}`}>
            <div className="error-display-content">
                <span className="error-display-icon">{ERROR_ICONS[type]}</span>
                <div className="error-display-text">
                    <span className="error-display-title">{ERROR_TITLES[type]}</span>
                    <span className="error-display-message">{message}</span>
                </div>
            </div>
            {onDismiss && (
                <button
                    className="error-display-dismiss"
                    onClick={onDismiss}
                    aria-label="Dismiss error"
                >
                    ×
                </button>
            )}
        </div>
    );
};

// Helper to detect error type from message
export const detectErrorType = (message: string): ErrorType => {
    const msg = message.toLowerCase();

    if (msg.includes('not installed') || msg.includes('not found') || msg.includes('no wallet')) {
        return 'wallet_not_found';
    }
    if (msg.includes('rejected') || msg.includes('cancelled') || msg.includes('denied') || msg.includes('refused')) {
        return 'user_rejected';
    }
    if (msg.includes('insufficient') || msg.includes('balance') || msg.includes('not enough')) {
        return 'insufficient_balance';
    }

    return 'general';
};
