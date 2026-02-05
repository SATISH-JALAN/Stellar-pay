import { useState, useEffect } from 'react';
import './PriceDisplay.css';

interface PriceData {
    usd: number;
    usd_24h_change: number;
}

export const PriceDisplay = () => {
    const [price, setPrice] = useState<PriceData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPrice = async () => {
            try {
                const response = await fetch(
                    'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd&include_24hr_change=true'
                );
                const data = await response.json();
                setPrice({
                    usd: data.stellar.usd,
                    usd_24h_change: data.stellar.usd_24h_change,
                });
            } catch (err) {
                console.error('Failed to fetch XLM price:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPrice();
        // Refresh every 60 seconds
        const interval = setInterval(fetchPrice, 60000);
        return () => clearInterval(interval);
    }, []);

    if (isLoading || !price) {
        return (
            <div className="price-ticker">
                <span className="price-loading">Loading XLM price...</span>
            </div>
        );
    }

    const isPositive = price.usd_24h_change >= 0;

    return (
        <div className="price-ticker">
            <span className="price-label">XLM</span>
            <span className="price-value">${price.usd.toFixed(4)}</span>
            <span className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? '↑' : '↓'} {Math.abs(price.usd_24h_change).toFixed(2)}%
            </span>
        </div>
    );
};
