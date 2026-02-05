const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * API client for server communication
 */
export const api = {
    /**
     * Get account balance
     */
    async getBalance(address: string): Promise<string> {
        try {
            const response = await fetch(`${API_BASE_URL}/balance/${address}`);
            const data = await response.json();
            return data.balance || '0';
        } catch (error) {
            console.error('API error - getBalance:', error);
            return '0';
        }
    },

    /**
     * Get transaction history
     */
    async getTransactions(address: string, limit: number = 10) {
        try {
            const response = await fetch(`${API_BASE_URL}/transactions/${address}?limit=${limit}`);
            const data = await response.json();
            return data.transactions || [];
        } catch (error) {
            console.error('API error - getTransactions:', error);
            return [];
        }
    },

    /**
     * Get contract information
     */
    async getContractInfo() {
        try {
            const response = await fetch(`${API_BASE_URL}/contract/info`);
            return await response.json();
        } catch (error) {
            console.error('API error - getContractInfo:', error);
            return null;
        }
    },

    /**
     * Get contract stats
     */
    async getContractStats() {
        try {
            const response = await fetch(`${API_BASE_URL}/contract/stats`);
            return await response.json();
        } catch (error) {
            console.error('API error - getContractStats:', error);
            return null;
        }
    },

    /**
     * Prepare log_payment transaction
     */
    async prepareLogPayment(
        sourcePublicKey: string,
        fromAddress: string,
        toAddress: string,
        amount: string
    ): Promise<string | null> {
        try {
            const response = await fetch(`${API_BASE_URL}/contract/log-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourcePublicKey, fromAddress, toAddress, amount }),
            });
            const data = await response.json();
            return data.txXdr || null;
        } catch (error) {
            console.error('API error - prepareLogPayment:', error);
            return null;
        }
    },

    /**
     * Health check
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            return response.ok;
        } catch {
            return false;
        }
    },
};
