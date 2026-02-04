import { useState } from 'react';
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
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen || !transaction) return null;

    const formatDate = (date: Date) => {
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 12)}...${address.slice(-12)}`;
    };

    const generatePDF = async (): Promise<Blob> => {
        const { default: jsPDF } = await import('jspdf');

        const doc = new jsPDF();

        // Header
        doc.setFontSize(24);
        doc.setTextColor(224, 122, 95);
        doc.text('Stellar Pay', 105, 25, { align: 'center' });

        doc.setFontSize(16);
        doc.setTextColor(129, 178, 154);
        doc.text('Transaction Receipt', 105, 35, { align: 'center' });

        // Status
        doc.setFontSize(14);
        doc.setTextColor(129, 178, 154);
        doc.text('✓ Transaction Successful', 105, 55, { align: 'center' });

        // Details box
        doc.setDrawColor(60, 60, 70);
        doc.setFillColor(30, 30, 36);
        doc.roundedRect(25, 65, 160, 80, 3, 3, 'FD');

        doc.setFontSize(12);
        doc.setTextColor(150, 150, 160);

        // Amount
        doc.text('Amount:', 35, 82);
        doc.setTextColor(129, 178, 154);
        doc.setFontSize(16);
        doc.text(`${transaction.amount} XLM`, 165, 82, { align: 'right' });

        // Destination
        doc.setFontSize(12);
        doc.setTextColor(150, 150, 160);
        doc.text('To:', 35, 98);
        doc.setTextColor(220, 220, 230);
        doc.setFontSize(10);
        doc.text(formatAddress(transaction.destination), 165, 98, { align: 'right' });

        // Date
        doc.setFontSize(12);
        doc.setTextColor(150, 150, 160);
        doc.text('Date:', 35, 114);
        doc.setTextColor(220, 220, 230);
        doc.text(formatDate(transaction.date), 165, 114, { align: 'right' });

        // Hash
        doc.setTextColor(150, 150, 160);
        doc.text('Transaction Hash:', 35, 130);
        doc.setTextColor(224, 122, 95);
        doc.setFontSize(9);
        doc.text(transaction.hash.slice(0, 36) + '...', 165, 130, { align: 'right' });

        // Footer
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 110);
        doc.text('View on Stellar Expert:', 105, 160, { align: 'center' });
        doc.setTextColor(224, 122, 95);
        doc.setFontSize(8);
        doc.text(`stellar.expert/explorer/testnet/tx/${transaction.hash.slice(0, 20)}...`, 105, 168, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(80, 80, 90);
        doc.text('Thank you for using Stellar Pay', 105, 185, { align: 'center' });

        return doc.output('blob');
    };

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            const pdfBlob = await generatePDF();
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `stellar-receipt-${transaction.hash.slice(0, 8)}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to generate PDF:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleShare = async () => {
        setIsGenerating(true);
        try {
            const pdfBlob = await generatePDF();
            const file = new File([pdfBlob], `stellar-receipt-${transaction.hash.slice(0, 8)}.pdf`, {
                type: 'application/pdf',
            });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'Stellar Pay Receipt',
                    text: `I just sent ${transaction.amount} XLM via Stellar Pay! 🚀`,
                    files: [file],
                });
            } else {
                // Fallback: Share text with link
                const shareText = `I just sent ${transaction.amount} XLM via Stellar Pay! 🚀\n\nTransaction: https://stellar.expert/explorer/testnet/tx/${transaction.hash}`;

                if (navigator.share) {
                    await navigator.share({
                        title: 'Stellar Pay Receipt',
                        text: shareText,
                        url: `https://stellar.expert/explorer/testnet/tx/${transaction.hash}`,
                    });
                } else {
                    // Fallback: copy to clipboard
                    await navigator.clipboard.writeText(shareText);
                    alert('Receipt link copied to clipboard! Share it on your favorite platform.');
                }
            }
        } catch (err) {
            // User cancelled or share failed
            console.log('Share cancelled or failed:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="receipt-overlay" onClick={onClose}>
            <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
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
                        <span className="detail-value hash">{transaction.hash.slice(0, 16)}...</span>
                    </div>
                </div>

                <a
                    href={`https://stellar.expert/explorer/testnet/tx/${transaction.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="stellar-expert-btn"
                >
                    View on Stellar Expert ↗
                </a>

                <div className="receipt-actions">
                    <button
                        className="receipt-btn download"
                        onClick={handleDownload}
                        disabled={isGenerating}
                    >
                        📄 {isGenerating ? 'Generating...' : 'Download PDF'}
                    </button>
                    <button
                        className="receipt-btn share"
                        onClick={handleShare}
                        disabled={isGenerating}
                    >
                        📤 Share
                    </button>
                </div>
            </div>
        </div>
    );
};
