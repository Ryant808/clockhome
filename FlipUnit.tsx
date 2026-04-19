'use client';

import React from 'react';
import DigitCard from './DigitCard';

interface FlipUnitProps {
  value: string;
  size?: 'large' | 'small';
  isMidnight?: boolean;
}

const FlipUnit = React.memo(function FlipUnit({ value, size = 'large', isMidnight = false }: FlipUnitProps) {
  const d0 = value.length > 0 ? value.charAt(0) : '0';
  const d1 = value.length > 1 ? value.charAt(1) : '0';

  return (
    <div className="flip-unit">
      <div className="flip-unit__cards">
        <DigitCard digit={d0} size={size} isMidnight={isMidnight} />
        <DigitCard digit={d1} size={size} isMidnight={isMidnight} />
      </div>
    </div>
  );
});

export default FlipUnit;
