import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

// Fade in from bottom animation
export const useFadeInUp = <T extends HTMLElement>(delay: number = 0) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, delay, ease: 'power3.out' }
      );
    }
  }, [delay]);

  return ref;
};

// Scale in animation
export const useScaleIn = <T extends HTMLElement>(delay: number = 0) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(
        ref.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.5, delay, ease: 'back.out(1.7)' }
      );
    }
  }, [delay]);

  return ref;
};

// Staggered children animation
export const useStaggerChildren = <T extends HTMLElement>(
  selector: string,
  delay: number = 0
) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (ref.current) {
      const children = ref.current.querySelectorAll(selector);
      gsap.fromTo(
        children,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          delay,
          ease: 'power2.out',
        }
      );
    }
  }, [selector, delay]);

  return ref;
};

// Number counter animation
export const animateNumber = (
  element: HTMLElement,
  from: number,
  to: number,
  duration: number = 1
) => {
  gsap.fromTo(
    element,
    { innerText: from },
    {
      innerText: to,
      duration,
      ease: 'power2.out',
      snap: { innerText: 0.01 },
      onUpdate: function () {
        const value = parseFloat(element.innerText);
        element.innerText = value.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 7,
        });
      },
    }
  );
};

// Hover scale effect
export const useHoverScale = <T extends HTMLElement>(scale: number = 1.02) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleEnter = () => {
      gsap.to(element, { scale, duration: 0.2, ease: 'power2.out' });
    };

    const handleLeave = () => {
      gsap.to(element, { scale: 1, duration: 0.2, ease: 'power2.out' });
    };

    element.addEventListener('mouseenter', handleEnter);
    element.addEventListener('mouseleave', handleLeave);

    return () => {
      element.removeEventListener('mouseenter', handleEnter);
      element.removeEventListener('mouseleave', handleLeave);
    };
  }, [scale]);

  return ref;
};

// Button press animation
export const useButtonPress = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleDown = () => {
      gsap.to(element, { scale: 0.95, duration: 0.1 });
    };

    const handleUp = () => {
      gsap.to(element, { scale: 1, duration: 0.2, ease: 'back.out(2)' });
    };

    element.addEventListener('mousedown', handleDown);
    element.addEventListener('mouseup', handleUp);
    element.addEventListener('mouseleave', handleUp);

    return () => {
      element.removeEventListener('mousedown', handleDown);
      element.removeEventListener('mouseup', handleUp);
      element.removeEventListener('mouseleave', handleUp);
    };
  }, []);

  return ref;
};
