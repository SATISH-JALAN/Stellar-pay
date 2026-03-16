import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import './LoadingProgress.css';

interface LoadingProgressProps {
    isLoading: boolean;
    label?: string;
}

/**
 * Top-of-page progress bar shown during async operations.
 * Animates from 0% → 80% while loading, then 80% → 100% on complete.
 */
export const LoadingProgress: React.FC<LoadingProgressProps> = ({
    isLoading,
    label,
}) => {
    const barRef = useRef<HTMLDivElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const bar = barRef.current;
        const wrap = wrapRef.current;
        if (!bar || !wrap) return;

        if (isLoading) {
            gsap.set(wrap, { opacity: 1 });
            gsap.fromTo(bar, { width: '0%' }, { width: '80%', duration: 2, ease: 'power1.out' });
        } else {
            gsap.to(bar, {
                width: '100%',
                duration: 0.3,
                ease: 'power2.out',
                onComplete: () => {
                    gsap.to(wrap, { opacity: 0, duration: 0.4, delay: 0.2 });
                    gsap.set(bar, { width: '0%', delay: 0.7 });
                },
            });
        }
    }, [isLoading]);

    return (
        <div className="loading-progress-wrap" ref={wrapRef} style={{ opacity: 0 }}>
            <div className="loading-progress-bar" ref={barRef} />
            {label && isLoading && <span className="loading-progress-label">{label}</span>}
        </div>
    );
};
