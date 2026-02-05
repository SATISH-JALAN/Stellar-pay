import React from 'react';
import './TransactionStatus.css';

interface TransactionStatusProps {
    status: 'idle' | 'pending' | 'success' | 'error';
    hash?: string;
    error?: string;
    onClose: () => void;
}

export const TransactionStatus: React.FC<TransactionStatusProps> = ({
    status,
    hash,
    error,
    onClose,
}) => {
    if (status === 'idle') return null;

    return (
        <div className={`transaction-status status-${status}`}>
            <button className="close-btn" onClick={onClose}>
                ×
            </button>

            {status === 'pending' && (
                <>
                    <div className="status-icon pending">
                        <div className="spinner-large"></div>
                    </div>
                    <h4>Processing Transaction</h4>
                    <p>Please sign the transaction in Freighter...</p>
                </>
            )}

            {status === 'success' && hash && (
                <>
                    <div className="status-icon success">✓</div>
                    <h4>Transaction Successful!</h4>
                    <p className="tx-hash">
                        Hash: <code>{hash.slice(0, 8)}...{hash.slice(-8)}</code>
                    </p>
                    <a
                        href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="view-explorer"
                    >
                        View on Stellar Expert ↗
                    </a>
                </>
            )}

            {status === 'error' && (
                <>
                    <div className="status-icon error">✕</div>
                    <h4>Transaction Failed</h4>
                    <p className="error-message">{error || 'An unknown error occurred'}</p>
                </>
            )}
        </div>
    );
};
