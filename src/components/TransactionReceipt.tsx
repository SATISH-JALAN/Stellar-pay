import { useRef } from 'react';
import './TransactionReceipt.css';

interface TransactionReceiptProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: {
        hash: string;
        destination: string;
        amount: string;
        date: Date;
        status: 'success' | 'error';
    } | null;
}

export const TransactionReceipt = ({ isOpen, onClose, transaction }: TransactionReceiptProps) => {
    const receiptRef = useRef<HTMLDivElement>(null);

    if (!isOpen || !transaction) return null;

    const formatDate = (date: Date) => {
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 12)}...${address.slice(-12)}`;
    };

    const handleDownload = () => {
        const receiptText = `
═══════════════════════════════════════════
           STELLAR PAY RECEIPT
═══════════════════════════════════════════

Status: ${transaction.status.toUpperCase()}
Date: ${formatDate(transaction.date)}

Amount: ${transaction.amount} XLM
To: ${transaction.destination}

Transaction Hash:
${transaction.hash}

View on Stellar Expert:
https://stellar.expert/explorer/testnet/tx/${transaction.hash}

═══════════════════════════════════════════
           Thank you for using Stellar Pay
═══════════════════════════════════════════
    `.trim();

        const blob = new Blob([receiptText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stellar-receipt-${transaction.hash.slice(0, 8)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleShare = async () => {
        const shareText = `I just sent ${transaction.amount} XLM via Stellar Pay! 🚀\n\nTx: ${transaction.hash.slice(0, 16)}...\nhttps://stellar.expert/explorer/testnet/tx/${transaction.hash}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Stellar Pay Receipt',
                    text: shareText,
                });
            } catch (err) {
                // User cancelled or share failed
            }
        } else {
            // Fallback: copy to clipboard
            await navigator.clipboard.writeText(shareText);
            alert('Receipt copied to clipboard!');
        }
    };

    return (
        <div className="receipt-overlay" onClick={onClose}>
            <div className="receipt-modal" ref={receiptRef} onClick={(e) => e.stopPropagation()}>
                <button className="receipt-close" onClick={onClose}>×</button>

                <div className="receipt-header">
                    <span className="receipt-icon">🧾</span>
                    <h3>Transaction Receipt</h3>
                </div>

                <div className="receipt-status success">
                    <span className="status-icon">✓</span>
                    <span>Transaction Successful</span>
                </div>

                <div className="receipt-details">
                    <div className="detail-row">
                        <span className="detail-label">Amount</span>
                        <span className="detail-value amount">{transaction.amount} XLM</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">To</span>
                        <span className="detail-value address">{formatAddress(transaction.destination)}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Date</span>
                        <span className="detail-value">{formatDate(transaction.date)}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Tx Hash</span>
                        <a
                            href={`https://stellar.expert/explorer/testnet/tx/${transaction.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="detail-value hash"
                        >
                            {transaction.hash.slice(0, 16)}...
                        </a>
                    </div>
                </div>

                <div className="receipt-actions">
                    <button className="receipt-btn download" onClick={handleDownload}>
                        📥 Download
                    </button>
                    <button className="receipt-btn share" onClick={handleShare}>
                        📤 Share
                    </button>
                </div>
            </div>
        </div>
    );
};
