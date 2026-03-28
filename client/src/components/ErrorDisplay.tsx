import React from 'react';
import { type ErrorType } from '../utils/detectErrorType';
import './ErrorDisplay.css';

export type { ErrorType } from '../utils/detectErrorType';
export { detectErrorType } from '../utils/detectErrorType';

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
