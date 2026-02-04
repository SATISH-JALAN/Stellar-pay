import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { gsap } from 'gsap';
import './QRCode.css';

interface QRCodeDisplayProps {
    address: string;
}

export const QRCodeDisplay = ({ address }: QRCodeDisplayProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const qrWrapperRef = useRef<HTMLDivElement>(null);

    // Animate modal open
    useEffect(() => {
        if (isOpen && modalRef.current && contentRef.current && qrWrapperRef.current) {
            const tl = gsap.timeline();

            // Backdrop fade in
            tl.fromTo(modalRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.3, ease: 'power2.out' }
            );

            // Content slide up and scale
            tl.fromTo(contentRef.current,
                { opacity: 0, y: 50, scale: 0.9 },
                { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.5)' },
                '-=0.2'
            );

            // QR code reveal with pulse
            tl.fromTo(qrWrapperRef.current,
                { opacity: 0, scale: 0.5, rotation: -10 },
                { opacity: 1, scale: 1, rotation: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' },
                '-=0.2'
            );

            // Add subtle pulse to QR
            tl.to(qrWrapperRef.current, {
                boxShadow: '0 0 30px rgba(224, 122, 95, 0.4)',
                duration: 0.8,
                repeat: 1,
                yoyo: true,
                ease: 'sine.inOut'
            });
        }
    }, [isOpen]);

    const handleClose = () => {
        if (modalRef.current && contentRef.current) {
            const tl = gsap.timeline({
                onComplete: () => setIsOpen(false)
            });

            tl.to(contentRef.current, {
                opacity: 0,
                y: -30,
                scale: 0.9,
                duration: 0.25,
                ease: 'power2.in'
            });

            tl.to(modalRef.current, {
                opacity: 0,
                duration: 0.2,
                ease: 'power2.in'
            }, '-=0.1');
        } else {
            setIsOpen(false);
        }
    };

    // Button hover animation
    const handleBtnEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
        gsap.to(e.currentTarget, { scale: 1.1, duration: 0.2, ease: 'power2.out' });
    };

    const handleBtnLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
        gsap.to(e.currentTarget, { scale: 1, duration: 0.2, ease: 'power2.out' });
    };

    const modal = isOpen ? (
        <div className="qr-modal" ref={modalRef} onClick={handleClose}>
            <div className="qr-content" ref={contentRef} onClick={(e) => e.stopPropagation()}>
                <button className="qr-close" onClick={handleClose}>×</button>

                <h4>Scan to Send XLM</h4>
                <p>Scan this QR code with any Stellar wallet</p>

                <div className="qr-wrapper" ref={qrWrapperRef}>
                    <QRCodeSVG
                        value={address}
                        size={200}
                        bgColor="#ffffff"
                        fgColor="#18181f"
                        level="M"
                    />
                </div>

                <div className="qr-address">
                    <code>{address}</code>
                </div>
            </div>
        </div>
    ) : null;

    return (
        <>
            <button
                className="qr-btn"
                onClick={() => setIsOpen(true)}
                onMouseEnter={handleBtnEnter}
                onMouseLeave={handleBtnLeave}
                title="Show QR Code"
            >
                📱
            </button>
            {modal && createPortal(modal, document.body)}
        </>
    );
};
