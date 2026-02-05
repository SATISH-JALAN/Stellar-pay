import React, { useState, useEffect } from 'react';
import {
    PAYMENT_REGISTRY_CONTRACT,
    DEPLOY_TX_HASH,
    getContractExplorerUrl,
    getDeployTxUrl,
    getPaymentCount
} from '../utils/soroban';
import './ContractStats.css';

interface ContractStatsProps {
    publicKey: string | null;
}

export const ContractStats: React.FC<ContractStatsProps> = ({ publicKey }) => {
    const [paymentCount, setPaymentCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!publicKey) return;

            setIsLoading(true);
            try {
                const count = await getPaymentCount();
                setPaymentCount(count);
            } catch (error) {
                console.error('Error fetching contract stats:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();

        // Refresh every 30 seconds
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [publicKey]);

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="contract-stats-card">
            <div className="contract-header">
                <span className="contract-icon">📜</span>
                <h3>Payment Registry Contract</h3>
                <span className="contract-badge">Soroban</span>
            </div>

            <div className="contract-info">
                <div className="stat-item">
                    <span className="stat-label">Contract ID</span>
                    <div className="stat-value-row">
                        <code
                            className="stat-value contract-id"
                            title={PAYMENT_REGISTRY_CONTRACT}
                            onClick={() => copyToClipboard(PAYMENT_REGISTRY_CONTRACT)}
                        >
                            {formatAddress(PAYMENT_REGISTRY_CONTRACT)}
                        </code>
                        <a
                            href={getContractExplorerUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="explorer-link"
                            title="View on Stellar Expert"
                        >
                            🔗
                        </a>
                    </div>
                </div>

                <div className="stat-item">
                    <span className="stat-label">Deploy Transaction</span>
                    <div className="stat-value-row">
                        <code
                            className="stat-value tx-hash"
                            title={DEPLOY_TX_HASH}
                        >
                            {formatAddress(DEPLOY_TX_HASH)}
                        </code>
                        <a
                            href={getDeployTxUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="explorer-link"
                            title="View transaction"
                        >
                            🔗
                        </a>
                    </div>
                </div>

                <div className="stat-item highlight">
                    <span className="stat-label">Payments Logged</span>
                    <span className="stat-value large">
                        {isLoading ? '...' : paymentCount}
                    </span>
                </div>
            </div>

            <div className="contract-functions">
                <span className="functions-label">Contract Functions:</span>
                <div className="function-list">
                    <span className="function-tag">log_payment</span>
                    <span className="function-tag">get_payment_count</span>
                    <span className="function-tag">get_payment</span>
                    <span className="function-tag">get_recent_payments</span>
                </div>
            </div>
        </div>
    );
};
