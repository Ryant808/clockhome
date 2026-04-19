'use client';

import React, { useRef, useLayoutEffect } from 'react';

interface DigitCardProps {
  digit: string;
  size?: 'large' | 'small';
  isMidnight?: boolean;
}

/**
 * DigitCard — uses useLayoutEffect so DOM mutations happen
 * synchronously BEFORE the browser paints. This guarantees
 * the flip animation starts in the exact same frame as the
 * second change, eliminating visual jitter.
 */
const DigitCard = React.memo(function DigitCard({ digit, size = 'large', isMidnight = false }: DigitCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const flipTopRef = useRef<HTMLDivElement>(null);
  const flipBottomRef = useRef<HTMLDivElement>(null);
  const topDigitRef = useRef<HTMLSpanElement>(null);
  const bottomDigitRef = useRef<HTMLSpanElement>(null);
  const flipTopDigitRef = useRef<HTMLSpanElement>(null);
  const flipBottomDigitRef = useRef<HTMLSpanElement>(null);
  const prevDigitRef = useRef(digit);
  const isAnimatingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup
  useLayoutEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    const prev = prevDigitRef.current;

    // No change — skip entirely
    if (digit === prev) return;
    prevDigitRef.current = digit;

    const flipTop = flipTopRef.current;
    const flipBottom = flipBottomRef.current;
    const topDigit = topDigitRef.current;
    const bottomDigit = bottomDigitRef.current;
    const flipTopDigit = flipTopDigitRef.current;
    const flipBottomDigit = flipBottomDigitRef.current;
    const card = cardRef.current;

    if (!card || !flipTop || !flipBottom || !topDigit || !bottomDigit || !flipTopDigit || !flipBottomDigit) return;

    // If previous animation still running, force-complete it first
    if (isAnimatingRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current);
      card.classList.remove('flipping');
    }

    // Prepare flip panels
    flipTopDigit.textContent = prev;   // OLD digit on flip-top
    flipBottomDigit.textContent = digit; // NEW digit on flip-bottom
    topDigit.textContent = digit;       // NEW digit on static top (hidden behind flip-top)

    isAnimatingRef.current = true;

    // Force reflow so the browser sees the class removal before re-adding
    void card.offsetWidth;

    // Trigger the CSS animation
    card.classList.add('flipping');

    // Clean up after animation completes
    timerRef.current = setTimeout(() => {
      isAnimatingRef.current = false;
      card.classList.remove('flipping');
      bottomDigit.textContent = digit; // ensure bottom static shows NEW digit
    }, 650);
  }, [digit]);

  return (
    <div ref={cardRef} className={`flip-card${isMidnight ? ' midnight-glow' : ''}`} style={{ perspective: '400px' }}>
      <div className="flip-card__top">
        <span ref={topDigitRef} className="flip-card__digit">{digit}</span>
      </div>
      <div className="flip-card__bottom">
        <span ref={bottomDigitRef} className="flip-card__digit">{digit}</span>
      </div>
      <div ref={flipTopRef} className="flip-card__flip-top">
        <span ref={flipTopDigitRef} className="flip-card__digit">{digit}</span>
      </div>
      <div ref={flipBottomRef} className="flip-card__flip-bottom">
        <span ref={flipBottomDigitRef} className="flip-card__digit">{digit}</span>
      </div>
      <div className="flip-card__divider" />
    </div>
  );
});

export default DigitCard;
