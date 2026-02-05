import { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './BalanceChart.css';

interface BalanceDataPoint {
    date: string;
    balance: number;
    timestamp: number;
}

interface BalanceChartProps {
    publicKey: string;
}

const HORIZON_URL = 'https://horizon-testnet.stellar.org';

export const BalanceChart = ({ publicKey }: BalanceChartProps) => {
    const [data, setData] = useState<BalanceDataPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBalanceHistory = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Fetch payment operations to reconstruct balance history
            const response = await fetch(
                `${HORIZON_URL}/accounts/${publicKey}/payments?order=asc&limit=100`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch payment history');
            }

            const json = await response.json();
            const records = json._embedded?.records || [];

            // Get current balance
            const accountRes = await fetch(`${HORIZON_URL}/accounts/${publicKey}`);
            const accountData = await accountRes.json();
            const currentBalance = parseFloat(
                accountData.balances?.find((b: any) => b.asset_type === 'native')?.balance || '0'
            );

            // Build balance history from payments
            const balanceHistory: BalanceDataPoint[] = [];
            let runningBalance = currentBalance;

            // Process in reverse to calculate backwards from current balance
            const reversedRecords = [...records].reverse();

            for (const record of reversedRecords) {
                if (record.type === 'payment' && record.asset_type === 'native') {
                    const amount = parseFloat(record.amount);
                    const date = new Date(record.created_at);

                    balanceHistory.unshift({
                        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        balance: Math.round(runningBalance * 100) / 100,
                        timestamp: date.getTime(),
                    });

                    // Adjust running balance (reverse the transaction)
                    if (record.from === publicKey) {
                        runningBalance += amount; // Was sent, so add back
                    } else {
                        runningBalance -= amount; // Was received, so subtract
                    }
                }
            }

            // Add initial point
            if (balanceHistory.length > 0) {
                const firstDate = new Date(balanceHistory[0].timestamp - 86400000);
                balanceHistory.unshift({
                    date: firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    balance: Math.round(runningBalance * 100) / 100,
                    timestamp: firstDate.getTime(),
                });
            }

            // Add current balance as final point
            balanceHistory.push({
                date: 'Now',
                balance: Math.round(currentBalance * 100) / 100,
                timestamp: Date.now(),
            });

            // Limit to last 10 data points for clarity
            const limitedData = balanceHistory.slice(-10);
            setData(limitedData);
        } catch (err) {
            console.error('Failed to fetch balance history:', err);
            setError('Failed to load balance history');
        } finally {
            setIsLoading(false);
        }
    }, [publicKey]);

    useEffect(() => {
        fetchBalanceHistory();
    }, [fetchBalanceHistory]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="chart-tooltip">
                    <p className="tooltip-balance">{payload[0].value.toLocaleString()} XLM</p>
                    <p className="tooltip-date">{payload[0].payload.date}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="chart-card">
            <div className="chart-header">
                <div className="chart-title">
                    <span className="chart-icon">📈</span>
                    <h3>Balance History</h3>
                </div>
                <button
                    className="refresh-chart-btn"
                    onClick={fetchBalanceHistory}
                    disabled={isLoading}
                    title="Refresh Chart - Update balance history from blockchain"
                >
                    🔄
                </button>
            </div>

            <div className="chart-container">
                {isLoading ? (
                    <div className="chart-loading">
                        <div className="spinner"></div>
                        <span>Loading chart...</span>
                    </div>
                ) : error ? (
                    <p className="chart-error">{error}</p>
                ) : data.length < 2 ? (
                    <p className="chart-empty">Not enough data to display chart</p>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#81b29a" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#81b29a" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#8a8a9a', fontSize: 11 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#8a8a9a', fontSize: 11 }}
                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="balance"
                                stroke="#81b29a"
                                strokeWidth={2}
                                fill="url(#balanceGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};
