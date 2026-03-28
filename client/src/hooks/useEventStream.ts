import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  const [lastPayment, setLastPayment] = useState<LivePayment | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const closeRef = useRef<(() => void) | null>(null);
  const onPaymentRef = useRef(onPayment);

  // Keep onPayment ref current after each render (safe: not called during render)
  useLayoutEffect(() => {
    onPaymentRef.current = onPayment;
  });

  useEffect(() => {
    // All work is deferred to a macrotask so no setState is called
    // synchronously in the effect body (react-hooks/set-state-in-effect).
    let cancelled = false;

    const timerId = setTimeout(() => {
      if (cancelled) return;

      // Tear down any previous stream
      if (closeRef.current) {
        closeRef.current();
        closeRef.current = null;
      }

      if (!publicKey) {
        setIsStreaming(false);
        return;
      }

      setIsStreaming(true);

      try {
        const close = server
          .payments()
          .forAccount(publicKey)
          .cursor('now') // only new payments from this point
          .stream({
            onmessage: (payment) => {
              if (cancelled) return;
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
              onPaymentRef.current?.(livePayment);
            },
            onerror: (err) => {
              console.error('Event stream error:', err);
              if (!cancelled) setIsStreaming(false);
            },
          });

        closeRef.current = close;
      } catch (err) {
        console.error('Failed to start event stream:', err);
        if (!cancelled) setIsStreaming(false);
      }
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timerId);
      if (closeRef.current) {
        closeRef.current();
        closeRef.current = null;
      }
      setIsStreaming(false);
    };
  }, [publicKey]);

  return { isStreaming, lastPayment };
};
