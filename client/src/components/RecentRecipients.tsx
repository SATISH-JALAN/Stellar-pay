import { useState, useEffect } from 'react';
import './RecentRecipients.css';

interface Recipient {
    address: string;
    lastSent: number;
    count: number;
}

interface RecentRecipientsProps {
    onSelectAddress: (address: string) => void;
}

const STORAGE_KEY = 'stellar-pay-recent-recipients';

export const RecentRecipients = ({ onSelectAddress }: RecentRecipientsProps) => {
    const [recipients, setRecipients] = useState<Recipient[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                // Sort by most recent and limit to 5
                const sorted = data
                    .sort((a: Recipient, b: Recipient) => b.lastSent - a.lastSent)
                    .slice(0, 5);
                setRecipients(sorted);
            } catch (e) {
                console.error('Failed to load recent recipients:', e);
            }
        }
    }, []);

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-6)}`;
    };

    if (recipients.length === 0) {
        return null;
    }

    return (
        <div className="recent-recipients">
            <span className="recent-label">Recent:</span>
            <div className="recent-list">
                {recipients.map((recipient) => (
                    <button
                        key={recipient.address}
                        className="recent-chip"
                        onClick={() => onSelectAddress(recipient.address)}
                        title={recipient.address}
                    >
                        {formatAddress(recipient.address)}
                    </button>
                ))}
            </div>
        </div>
    );
};

// Utility function to save a recipient (call after successful send)
export const saveRecentRecipient = (address: string) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    let recipients: Recipient[] = [];

    if (stored) {
        try {
            recipients = JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse recipients:', e);
        }
    }

    const existingIndex = recipients.findIndex(r => r.address === address);

    if (existingIndex >= 0) {
        recipients[existingIndex].lastSent = Date.now();
        recipients[existingIndex].count += 1;
    } else {
        recipients.push({
            address,
            lastSent: Date.now(),
            count: 1,
        });
    }

    // Keep only last 10 unique recipients
    const sorted = recipients
        .sort((a, b) => b.lastSent - a.lastSent)
        .slice(0, 10);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
};
