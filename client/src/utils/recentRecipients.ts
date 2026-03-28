const STORAGE_KEY = 'stellar-pay-recent-recipients';

interface Recipient {
    address: string;
    lastSent: number;
    count: number;
}

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
        recipients.push({ address, lastSent: Date.now(), count: 1 });
    }

    const sorted = recipients.sort((a, b) => b.lastSent - a.lastSent).slice(0, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
};
