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

function loadRecipients(): Recipient[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return (JSON.parse(stored) as Recipient[])
                .sort((a, b) => b.lastSent - a.lastSent)
                .slice(0, 5);
        } catch (e) {
            console.error('Failed to load recent recipients:', e);
        }
    }
    return [];
}

export const RecentRecipients = ({ onSelectAddress }: RecentRecipientsProps) => {
    const recipients = loadRecipients();

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
