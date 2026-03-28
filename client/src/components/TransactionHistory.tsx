import { useState, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import './TransactionHistory.css';

interface Transaction {
    id: string;
    type: 'sent' | 'received';
    amount: string;
    asset: string;
    counterparty: string;
    date: Date;
    hash: string;
}

interface TransactionHistoryProps {
    publicKey: string;
    latestTxHash?: string;
}

const HORIZON_URL = 'https://horizon-testnet.stellar.org';

const PAYMENT_RECORD_TYPES = new Set([
    'payment',
    'path_payment_strict_send',
    'path_payment_strict_receive',
]);

interface HorizonPaymentRecord {
    id: string;
    type: string;
    amount?: string;
    destination_amount?: string;
    source_amount?: string;
    asset_type?: string;
    asset_code?: string;
    destination_asset_type?: string;
    destination_asset_code?: string;
    source_asset_type?: string;
    source_asset_code?: string;
    from: string;
    to: string;
    created_at: string;
    transaction_hash: string;
}

const parseAmount = (record: HorizonPaymentRecord): string => {
    const rawAmount = record.amount ?? record.destination_amount ?? record.source_amount ?? '0';
    const amount = Number.parseFloat(String(rawAmount));
    return Number.isFinite(amount) ? amount.toFixed(2) : '0.00';
};

const parseAsset = (record: HorizonPaymentRecord): string => {
    const assetType = record.asset_type ?? record.destination_asset_type ?? record.source_asset_type;
    const assetCode = record.asset_code ?? record.destination_asset_code ?? record.source_asset_code;
    return assetType === 'native' ? 'XLM' : (assetCode || 'ASSET');
};

export const TransactionHistory = ({ publicKey, latestTxHash }: TransactionHistoryProps) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filteredTxs, setFilteredTxs] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'sent' | 'received'>('all');
    const [showAll, setShowAll] = useState(false);

    const INITIAL_DISPLAY_COUNT = 2;

    // Get transactions to display
    const displayedTxs = showAll ? filteredTxs : filteredTxs.slice(0, INITIAL_DISPLAY_COUNT);
    const hasMoreTxs = filteredTxs.length > INITIAL_DISPLAY_COUNT;

    // Fetch transactions from Horizon
    const fetchTransactions = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${HORIZON_URL}/accounts/${publicKey}/payments?order=desc&limit=50`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch transactions');
            }

            const data = await response.json();
            const records = data._embedded?.records || [];

            const txs: Transaction[] = records
                .filter((record: HorizonPaymentRecord) => PAYMENT_RECORD_TYPES.has(record.type))
                .map((record: HorizonPaymentRecord) => ({
                    id: record.id,
                    type: record.from === publicKey ? 'sent' : 'received',
                    amount: parseAmount(record),
                    asset: parseAsset(record),
                    counterparty: record.from === publicKey ? record.to : record.from,
                    date: new Date(record.created_at),
                    hash: record.transaction_hash,
                }));

            setTransactions(txs);
            setFilteredTxs(txs);
        } catch (err) {
            console.error('Failed to fetch transactions:', err);
            setError('Failed to load transactions');
        } finally {
            setIsLoading(false);
        }
    }, [publicKey]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    useEffect(() => {
        if (!latestTxHash) return;

        // Horizon indexing may lag briefly after submission.
        const timer = window.setTimeout(() => {
            fetchTransactions();
        }, 2500);

        return () => window.clearTimeout(timer);
    }, [latestTxHash, fetchTransactions]);

    // Filter transactions
    useEffect(() => {
        let filtered = transactions;

        // Filter by type
        if (filterType !== 'all') {
            filtered = filtered.filter(tx => tx.type === filterType);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(tx =>
                tx.counterparty.toLowerCase().includes(query) ||
                tx.amount.includes(query) ||
                tx.hash.toLowerCase().includes(query)
            );
        }

        setFilteredTxs(filtered);
    }, [transactions, searchQuery, filterType]);

    // Animate list items
    useEffect(() => {
        if (!isLoading && filteredTxs.length > 0) {
            gsap.fromTo('.tx-item',
                { opacity: 0, x: -20 },
                { opacity: 1, x: 0, duration: 0.3, stagger: 0.05, ease: 'power2.out' }
            );
        }
    }, [isLoading, filteredTxs]);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-6)}`;
    };

    const exportToPDF = async () => {
        if (filteredTxs.length === 0) return;

        // Dynamic import to reduce bundle size
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');

        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(224, 122, 95);
        doc.text('Stellar Pay', 14, 20);

        doc.setFontSize(14);
        doc.setTextColor(100);
        doc.text('Transaction History Report', 14, 30);

        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);
        doc.text(`Total Transactions: ${filteredTxs.length}`, 14, 44);

        // Table data
        const tableData = filteredTxs.map(tx => [
            tx.date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            tx.type.toUpperCase(),
            `${tx.type === 'sent' ? '-' : '+'}${tx.amount} ${tx.asset}`,
            `${tx.counterparty.slice(0, 12)}...${tx.counterparty.slice(-8)}`,
        ]);

        autoTable(doc, {
            startY: 52,
            head: [['Date', 'Type', 'Amount', 'Counterparty']],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: [224, 122, 95],
                textColor: [24, 24, 31],
                fontStyle: 'bold',
            },
            alternateRowStyles: {
                fillColor: [30, 30, 36],
            },
            styles: {
                textColor: [200, 200, 200],
                cellPadding: 4,
            },
        });

        doc.save(`stellar-transactions-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="history-card">
            <div className="history-header">
                <div className="history-title">
                    <span className="history-icon">📜</span>
                    <h3>Transaction History</h3>
                </div>
                <div className="history-actions">
                    <button
                        className="export-btn"
                        onClick={exportToPDF}
                        disabled={filteredTxs.length === 0}
                        title="Download PDF Report - Export your transaction history as a professional PDF document"
                    >
                        📄
                    </button>
                    <button
                        className="refresh-history-btn"
                        onClick={fetchTransactions}
                        disabled={isLoading}
                        title="Refresh Transactions - Fetch the latest transactions from the blockchain"
                    >
                        🔄
                    </button>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="history-filters">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search by address or amount..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="filter-tabs">
                    <button
                        className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterType('all')}
                    >
                        All
                    </button>
                    <button
                        className={`filter-tab ${filterType === 'sent' ? 'active' : ''}`}
                        onClick={() => setFilterType('sent')}
                    >
                        Sent
                    </button>
                    <button
                        className={`filter-tab ${filterType === 'received' ? 'active' : ''}`}
                        onClick={() => setFilterType('received')}
                    >
                        Received
                    </button>
                </div>
            </div>

            {/* Transaction List */}
            <div className="tx-list">
                {isLoading ? (
                    <div className="tx-loading">
                        <div className="spinner"></div>
                        <span>Loading transactions...</span>
                    </div>
                ) : error ? (
                    <p className="tx-error">{error}</p>
                ) : filteredTxs.length === 0 ? (
                    <p className="tx-empty">
                        {searchQuery || filterType !== 'all'
                            ? 'No transactions match your filters'
                            : 'No transactions yet'}
                    </p>
                ) : (
                    <>
                        <div
                            className={`tx-items-container ${showAll ? 'expanded' : ''}`}
                            data-lenis-prevent
                        >
                            {displayedTxs.map((tx) => (
                                <a
                                    key={tx.id}
                                    href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="tx-item"
                                >
                                    <div className="tx-icon-wrapper">
                                        <span className={`tx-type-icon ${tx.type}`}>
                                            {tx.type === 'sent' ? '↑' : '↓'}
                                        </span>
                                    </div>
                                    <div className="tx-details">
                                        <span className="tx-counterparty">
                                            {tx.type === 'sent' ? 'To: ' : 'From: '}
                                            {formatAddress(tx.counterparty)}
                                        </span>
                                        <span className="tx-date">{formatDate(tx.date)}</span>
                                    </div>
                                    <div className={`tx-amount ${tx.type}`}>
                                        {tx.type === 'sent' ? '-' : '+'}
                                        {tx.amount} {tx.asset}
                                    </div>
                                </a>
                            ))}
                        </div>
                        {hasMoreTxs && (
                            <button
                                className="show-more-btn"
                                onClick={() => setShowAll(!showAll)}
                            >
                                {showAll ? (
                                    <>
                                        <span>Show Less</span>
                                        <span className="show-more-icon">↑</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Show More ({filteredTxs.length - INITIAL_DISPLAY_COUNT} more)</span>
                                        <span className="show-more-icon">↓</span>
                                    </>
                                )}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
