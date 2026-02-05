import express from 'express';
import { 
    getBalance, 
    getTransactions, 
    getPaymentCount, 
    prepareLogPaymentTx,
    getContractInfo 
} from '../services/soroban.js';

const router = express.Router();

/**
 * GET /api/balance/:address
 * Get account balance
 */
router.get('/balance/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const balance = await getBalance(address);
        res.json({ balance });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get balance' });
    }
});

/**
 * GET /api/transactions/:address
 * Get transaction history
 */
router.get('/transactions/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const limit = parseInt(req.query.limit as string) || 10;
        const transactions = await getTransactions(address, limit);
        res.json({ transactions });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get transactions' });
    }
});

/**
 * GET /api/contract/info
 * Get contract information
 */
router.get('/contract/info', (req, res) => {
    const info = getContractInfo();
    res.json(info);
});

/**
 * GET /api/contract/stats
 * Get contract statistics
 */
router.get('/contract/stats', async (req, res) => {
    try {
        const paymentCount = await getPaymentCount();
        const info = getContractInfo();
        res.json({ 
            ...info, 
            paymentCount 
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get contract stats' });
    }
});

/**
 * POST /api/contract/log-payment
 * Prepare a log_payment transaction (returns unsigned XDR)
 */
router.post('/contract/log-payment', async (req, res) => {
    try {
        const { sourcePublicKey, fromAddress, toAddress, amount } = req.body;
        
        if (!sourcePublicKey || !fromAddress || !toAddress || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const txXdr = await prepareLogPaymentTx(sourcePublicKey, fromAddress, toAddress, amount);
        
        if (!txXdr) {
            return res.status(500).json({ error: 'Failed to prepare transaction' });
        }
        
        res.json({ txXdr });
    } catch (error) {
        res.status(500).json({ error: 'Failed to prepare log_payment transaction' });
    }
});

export default router;
