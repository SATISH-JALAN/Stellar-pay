import React, { useState, useEffect, useCallback } from 'react';
import {
    PAYMENT_REGISTRY_CONTRACT,
    DEPLOY_TX_HASH,
    getContractExplorerUrl,
    getDeployTxUrl,
    getPaymentCount,
    getRecentPayments,
    type OnChainPayment,
} from '../utils/soroban';
import './ContractStats.css';

interface ContractStatsProps {
    publicKey: string | null;
}

const formatAddr = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;
const formatTime = (ts: number) => {
    if (!ts) return '—';
    return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const ContractStats: React.FC<ContractStatsProps> = ({ publicKey }) => {
    const [paymentCount, setPaymentCount] = useState<number>(0);
    const [recentPayments, setRecentPayments] = useState<OnChainPayment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingRecent, setIsLoadingRecent] = useState(false);
    const [showRecent, setShowRecent] = useState(false);

    const fetchStats = useCallback(async () => {
        if (!publicKey) return;
        setIsLoading(true);
        try {
            const count = await getPaymentCount(publicKey);
            setPaymentCount(count);
        } catch (error) {
            console.error('Error fetching contract stats:', error);
        } finally {
            setIsLoading(false);
        }
    }, [publicKey]);

    const fetchRecentPayments = useCallback(async () => {
        if (!publicKey) return;
        setIsLoadingRecent(true);
        try {
            const payments = await getRecentPayments(publicKey);
            setRecentPayments(payments);
        } catch (error) {
            console.error('Error fetching recent payments:', error);
        } finally {
            setIsLoadingRecent(false);
        }
    }, [publicKey]);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    useEffect(() => {
        if (showRecent) fetchRecentPayments();
    }, [showRecent, fetchRecentPayments]);

    const copyToClipboard = async (text: string) => {
        try { await navigator.clipboard.writeText(text); } catch { }
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
                            {formatAddr(PAYMENT_REGISTRY_CONTRACT)}
                        </code>
                        <a href={getContractExplorerUrl()} target="_blank" rel="noopener noreferrer" className="explorer-link">🔗</a>
                    </div>
                </div>

                <div className="stat-item">
                    <span className="stat-label">Deploy Transaction</span>
                    <div className="stat-value-row">
                        <code className="stat-value tx-hash" title={DEPLOY_TX_HASH}>
                            {formatAddr(DEPLOY_TX_HASH)}
                        </code>
                        <a href={getDeployTxUrl()} target="_blank" rel="noopener noreferrer" className="explorer-link">🔗</a>
                    </div>
                </div>

                <div className="stat-item highlight">
                    <span className="stat-label">Payments Logged On-Chain</span>
                    <span className="stat-value large">
                        {isLoading ? '...' : paymentCount}
                    </span>
                </div>
            </div>

            <button
                className="recent-payments-toggle"
                onClick={() => setShowRecent(v => !v)}
                disabled={paymentCount === 0}
            >
                {showRecent ? '▲ Hide' : '▼ Show'} Recent Payments
                {paymentCount > 0 && (
                    <span className="recent-badge">{Math.min(paymentCount, 10)}</span>
                )}
            </button>

            {showRecent && (
                <div className="recent-payments">
                    {isLoadingRecent ? (
                        <div className="recent-loading">
                            <div className="spinner-small" /> Fetching from chain...
                        </div>
                    ) : recentPayments.length === 0 ? (
                        <p className="recent-empty">No payments found on-chain yet.</p>
                    ) : (
                        <div className="recent-list">
                            {recentPayments.map((p, i) => (
                                <div key={i} className="recent-item">
                                    <div className="recent-addresses">
                                        <span className="recent-from" title={p.from}>{formatAddr(p.from)}</span>
                                        <span className="recent-arrow">→</span>
                                        <span className="recent-to" title={p.to}>{formatAddr(p.to)}</span>
                                    </div>
                                    <div className="recent-meta">
                                        <span className="recent-amount">{parseFloat(p.amount).toFixed(2)} XLM</span>
                                        {p.fromBalance && (
                                            <span className="recent-balance" title="Sender balance at time of payment">
                                                bal: {p.fromBalance} XLM
                                            </span>
                                        )}
                                        <span className="recent-time">{formatTime(p.timestamp)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <button className="refresh-recent-btn" onClick={fetchRecentPayments} disabled={isLoadingRecent}>
                        🔄 Refresh
                    </button>
                </div>
            )}

            <div className="contract-functions">
                <span className="functions-label">Contract Functions:</span>
                <div className="function-list">
                    <span className="function-tag active">log_payment</span>
                    <span className="function-tag active">get_payment_count</span>
                    <span className="function-tag active">get_payment</span>
                    <span className="function-tag active">get_recent_payments</span>
                </div>
            </div>
        </div>
    );
};
