import React, { useEffect, useRef, useState } from 'react';

const FULL_NAME = 'SARMANSINH SOLANKI';
const NAME_CHARS = Array.from(FULL_NAME);

export const ClosingNameSignature: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const [typedCount, setTypedCount] = useState(0);
  const [showCursor, setShowCursor] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setTypedCount(NAME_CHARS.length);
      setShowCursor(false);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setInView(true);
        } else if (entry.intersectionRatio === 0) {
          setInView(false);
          setTypedCount(0);
          setShowCursor(false);
        }
      },
      { threshold: [0, 0.18] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setTypedCount(NAME_CHARS.length);
      return;
    }

    setTypedCount(0);
    setShowCursor(true);

    let current = 0;
    let hideCursorTimeout: number | undefined;

    const typingInterval = window.setInterval(() => {
      current += 1;
      setTypedCount(current);

      if (current >= NAME_CHARS.length) {
        window.clearInterval(typingInterval);
        hideCursorTimeout = window.setTimeout(() => {
          setShowCursor(false);
        }, 700);
      }
    }, 72);

    return () => {
      window.clearInterval(typingInterval);
      if (hideCursorTimeout !== undefined) {
        window.clearTimeout(hideCursorTimeout);
      }
    };
  }, [inView]);

  return (
    <div
      ref={containerRef}
      aria-label="Sarmansinh Solanki"
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-3 sm:px-6 select-none font-display text-[clamp(1.25rem,7.8vw,8.2rem)] font-extralight leading-none tracking-[-0.015em]"
    >
      <div className="relative inline-flex items-baseline whitespace-nowrap origin-center scale-y-[1.24] sm:scale-y-[1.28] text-[#dce4ff]/80 drop-shadow-[0_4px_28px_rgba(2,6,72,0.85)]">
        {NAME_CHARS.map((char, idx) => {
          const isRevealed = idx < typedCount;
          const isCursorHere = showCursor && idx === typedCount;

          return (
            <span key={idx} className="relative inline-flex items-baseline">
              {isCursorHere && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -left-[2px] bottom-[0.08em] h-[0.72em] w-[2px] sm:w-[3px] bg-[#b8c2ff]/70 animate-pulse"
                />
              )}
              <span
                aria-hidden="true"
                className={`inline-block will-change-[opacity,transform] ${
                  char === ' ' ? 'w-[0.26em]' : ''
                } ${
                  isRevealed
                    ? 'opacity-100 translate-y-0 transition-all duration-300 ease-out'
                    : 'opacity-0 translate-y-2 transition-none'
                }`}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            </span>
          );
        })}

        {showCursor && typedCount >= NAME_CHARS.length && (
          <span
            aria-hidden="true"
            className="ml-1 inline-block h-[0.72em] w-[2px] sm:w-[3px] bg-[#b8c2ff]/65 animate-pulse self-center"
          />
        )}
      </div>
    </div>
  );
};
