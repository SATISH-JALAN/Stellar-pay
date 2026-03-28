import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import type { LivePayment } from '../hooks/useEventStream';
import './LivePaymentToast.css';

interface LivePaymentToastProps {
    payment: LivePayment | null;
    onDismiss: () => void;
}

const formatAddr = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

export const LivePaymentToast: React.FC<LivePaymentToastProps> = ({ payment, onDismiss }) => {
    const toastRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!payment || !toastRef.current) return;

        // Animate in
        gsap.fromTo(
            toastRef.current,
            { x: 120, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' }
        );

        // Auto-dismiss after 5s
        const timer = setTimeout(() => {
            if (toastRef.current) {
                gsap.to(toastRef.current, {
                    x: 120,
                    opacity: 0,
                    duration: 0.3,
                    ease: 'power2.in',
                    onComplete: onDismiss,
                });
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, [payment, onDismiss]);

    if (!payment) return null;

    const isReceived = payment.type === 'received';

    return (
        <div
            className={`live-toast live-toast-${payment.type}`}
            ref={toastRef}
            onClick={onDismiss}
            role="alert"
        >
            <div className="live-toast-icon">{isReceived ? '📥' : '📤'}</div>
            <div className="live-toast-content">
                <span className="live-toast-title">
                    {isReceived ? 'Payment Received' : 'Payment Sent'}
                </span>
                <span className="live-toast-detail">
                    {isReceived ? '+' : '-'}{payment.amount} XLM
                    {isReceived ? ' from ' : ' to '}
                    {formatAddr(payment.counterparty)}
                </span>
            </div>
            <div className="live-toast-pulse" />
        </div>
    );
};
