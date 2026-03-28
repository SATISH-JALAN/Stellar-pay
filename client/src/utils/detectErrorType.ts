export type ErrorType = 'wallet_not_found' | 'user_rejected' | 'insufficient_balance' | 'general';

export const detectErrorType = (message: string): ErrorType => {
    const msg = message.toLowerCase();
    if (msg.includes('not installed') || msg.includes('not found') || msg.includes('no wallet')) {
        return 'wallet_not_found';
    }
    if (msg.includes('rejected') || msg.includes('cancelled') || msg.includes('denied') || msg.includes('refused')) {
        return 'user_rejected';
    }
    if (msg.includes('insufficient') || msg.includes('balance') || msg.includes('not enough')) {
        return 'insufficient_balance';
    }
    return 'general';
};
