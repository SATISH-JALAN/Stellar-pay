import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import stellarRoutes from './routes/stellar.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api', stellarRoutes);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`🚀 Stellar Pay API running on http://localhost:${PORT}`);
    console.log(`📡 Using Soroban RPC: ${process.env.SOROBAN_RPC_URL}`);
});
