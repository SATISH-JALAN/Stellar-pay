import { useEffect, useRef, useCallback, useState } from 'react';
import { server } from '../utils/stellar';

export interface LivePayment {
  id: string;
  type: 'received' | 'sent';
  amount: string;
  counterparty: string;
  timestamp: string;
}

interface UseEventStreamOptions {
  publicKey: string | null;
  onPayment?: (payment: LivePayment) => void;
}

export const useEventStream = ({ publicKey, onPayment }: UseEventStreamOptions) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastPayment, setLastPayment] = useState<LivePayment | null>(null);
  const closeRef = useRef<(() => void) | null>(null);

  const startStream = useCallback(() => {
    if (!publicKey) return;

    // Close any existing stream
    if (closeRef.current) closeRef.current();

    setIsStreaming(true);

    try {
      const close = server
        .payments()
        .forAccount(publicKey)
        .cursor('now') // only new payments from this point
        .stream({
          onmessage: (payment) => {
            // Only handle native XLM payments
            if (payment.type !== 'payment') return;
            const p = payment as {
              type: string;
              asset_type: string;
              amount: string;
              from: string;
              to: string;
              created_at: string;
              id: string;
            };
            if (p.asset_type !== 'native') return;

            const isReceived = p.to === publicKey;
            const livePayment: LivePayment = {
              id: p.id,
              type: isReceived ? 'received' : 'sent',
              amount: parseFloat(p.amount).toFixed(2),
              counterparty: isReceived ? p.from : p.to,
              timestamp: p.created_at,
            };

            setLastPayment(livePayment);
            onPayment?.(livePayment);
          },
          onerror: (err) => {
            console.error('Event stream error:', err);
            setIsStreaming(false);
          },
        });

      closeRef.current = close;
    } catch (err) {
      console.error('Failed to start event stream:', err);
      setIsStreaming(false);
    }
  }, [publicKey, onPayment]);

  const stopStream = useCallback(() => {
    if (closeRef.current) {
      closeRef.current();
      closeRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // Auto-start when publicKey is available
  useEffect(() => {
    if (publicKey) {
      startStream();
    } else {
      stopStream();
    }
    return () => stopStream();
  }, [publicKey, startStream, stopStream]);

  return { isStreaming, lastPayment };
};
